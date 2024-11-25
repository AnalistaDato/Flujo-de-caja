import pandas as pd
from sqlalchemy.sql import text
from datetime import date, timedelta
from db import get_engine


# Obtener datos de la base de datos
def fetch_data_from_db(empresa, banco, engine):
    query_check_column = f"""
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'facturas_consolidadas' AND column_name = 'fecha_reprogramacion'
    """
    column_exists = pd.read_sql(query_check_column, engine).shape[0] > 0

    if column_exists:
        query = f"""
        SELECT fecha, COALESCE(fecha_reprogramacion, fecha) AS fecha_uso, credito, debito, tipo_transaccion
        FROM facturas_consolidadas
        WHERE empresa = '{empresa}' AND banco = '{banco}'
        ORDER BY fecha_uso
        """
    else:
        query = f"""
        SELECT fecha AS fecha_uso, credito, debito, tipo_transaccion
        FROM facturas_consolidadas
        WHERE empresa = '{empresa}' AND banco = '{banco}'
        ORDER BY fecha
        """

    return pd.read_sql(query, engine)

# Generar columna de fecha efectiva
def determine_effective_date(df):
    if "fecha_reprogramacion" in df.columns:
        df["fecha_efectiva"] = df.apply(
            lambda row: (
                row["fecha_reprogramacion"]
                if pd.notna(row["fecha_reprogramacion"])
                else row["fecha"]
            ),
            axis=1,
        )
    else:
        df["fecha_efectiva"] = df["fecha"]

    df["fecha_efectiva"] = pd.to_datetime(df["fecha_efectiva"], errors="coerce")
    return df


# Verificar existencia de saldo
def check_balance_exists(engine, fecha, empresa, banco, transaction_type):
    query = f"""
    SELECT 1
    FROM facturas_consolidadas
    WHERE fecha = '{fecha}' AND empresa = '{empresa}' 
    AND banco = '{banco}' AND tipo_transaccion = '{transaction_type}'
    LIMIT 1
    """
    result = pd.read_sql(query, engine)
    return not result.empty


# Insertar saldos iniciales y finales
def insert_balance(engine, fecha, amount, empresa, banco,transaction_type):
    query = text(
        """
        INSERT INTO facturas_consolidadas (socio, fecha, credito, debito, empresa, banco, tipo_transaccion)
        VALUES (:socio, :fecha, :credito, :debito, :empresa, :banco, :tipo_transaccion)
    """
    )
    credito = max(amount, 0)
    debito = max(-amount, 0)

    with engine.connect() as conn:
        transaction = conn.begin()
        try:
            conn.execute(
                query,
                {
                    "socio": transaction_type,
                    "fecha": fecha,
                    "credito": credito,
                    "debito": debito,
                    "empresa": empresa,
                    "banco": banco,
                    "tipo_transaccion": transaction_type,
                },
            )
            transaction.commit()
            print(
                f"Inserted {transaction_type} for {empresa}, {banco} on {fecha}: {amount}"
            )
        except Exception as e:
            transaction.rollback()
            print(f"Error inserting balance: {e}")



# Generar saldo inicial para un día específico
def generate_initial_balance(engine, fecha, empresa, banco, previous_final_balance):
    # Generamos el saldo inicial basado en el saldo final del día anterior
    if not check_balance_exists(engine, fecha, empresa, banco, "SALDO INICIAL"):
        insert_balance(engine, fecha, previous_final_balance, empresa, banco, "SALDO INICIAL")
    return previous_final_balance


# Generar saldo final para un día específico
def generate_final_balance(engine, fecha, empresa, banco):
    query = f"""
    SELECT SUM(credito) AS total_credito, SUM(debito) AS total_debito
    FROM facturas_consolidadas
    WHERE fecha = '{fecha}' AND empresa = '{empresa}' AND banco = '{banco}'
    """
    result = pd.read_sql(query, engine)
    
    total_credito = result["total_credito"].iloc[0]
    total_debito = result["total_debito"].iloc[0]
    
    print(f"Credito {total_credito}, Debito {total_debito}")

    # Calcular el saldo final
    saldo_final = total_credito - total_debito


    # Verificar si ya existe un saldo final para esa fecha, empresa y banco
    if not check_balance_exists(engine, fecha, empresa, banco, "SALDO FINAL"):
        insert_balance(engine, fecha, saldo_final, empresa, banco, "SALDO FINAL")

    print(f"Saldo final para {empresa}, {banco} el {fecha}: {saldo_final}")
    return saldo_final


def ensure_balances_for_all_days(engine, empresa, banco):
    df = fetch_data_from_db(empresa, banco, engine)
    if df.empty:
        print(f"No hay datos para {empresa}, {banco}.")
        return


    df = determine_effective_date(df)


    all_dates = pd.date_range(start=df["fecha_efectiva"].min(), end=df["fecha_efectiva"].max())
    previous_final_balance = 0
    previous_final_balance = 0

    for current_date in all_dates:
        print(f"Procesando saldos para {empresa}, {banco} en {current_date.date()}.")
        previous_final_balance = generate_initial_balance(engine, current_date.date(), empresa, banco, previous_final_balance)
        previous_final_balance = generate_final_balance(engine, current_date.date(), empresa, banco)



# Obtener lista de empresas y bancos únicos
def fetch_empresas_bancos(engine):
    query = "SELECT DISTINCT empresa, banco FROM facturas_consolidadas"
    df = pd.read_sql(query, engine)
    df["banco"] = df["banco"].fillna("sin banco")  # Reemplazar valores nulos
    return df


# Función principal
def main():
    print("=== Iniciando ejecución del script ===")
    engine = get_engine()

    try:
        engine.connect()
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return

    # Obtener las empresas y bancos únicos
    empresas_bancos = fetch_empresas_bancos(engine)

    # Procesar cada empresa y banco
    for _, row in empresas_bancos.iterrows():
        empresa, banco = row["empresa"], row["banco"]

        if pd.isna(empresa) or pd.isna(banco):
            print(f"Datos faltantes en empresa o banco. Saltando: {empresa}, {banco}")
            continue

        print(f"Verificando saldos para {empresa}, {banco}")

        # Asegurarse de que los datos estén listos y procesar los saldos
        ensure_balances_for_all_days(engine, empresa, banco)

    print("=== Script finalizado ===")


if __name__ == "__main__":
    main()
