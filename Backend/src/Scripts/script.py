import os
from sqlalchemy import create_engine, text
import pandas as pd
from datetime import datetime
import sys
import hashlib

# Configura la conexión a la base de datos MariaDB
DATABASE_URI = "mysql+pymysql://root:@localhost:3306/flujo_de_caja"
engine = create_engine(DATABASE_URI)

def process_file(file_path):
    """Lee un archivo CSV o Excel y retorna un DataFrame."""
    if file_path.endswith(".csv"):
        return pd.read_csv(file_path)
    elif file_path.endswith(".xlsx"):
        return pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file type")

def convert_to_datetime(date_str):
    """Convierte una cadena de texto o un objeto datetime a un objeto datetime."""
    if pd.isna(date_str):
        return pd.NaT

    if isinstance(date_str, pd.Timestamp):
        return date_str.to_pydatetime()

    if isinstance(date_str, str):
        normalized_date_str = date_str.replace("a. m.", "AM").replace("p. m.", "PM")
        try:
            return datetime.strptime(normalized_date_str, "%d/%m/%Y %I:%M:%S %p")
        except ValueError as e:
            print(f"Error al convertir la cadena '{date_str}': {e}")
            return pd.NaT
    else:
        print(f"Tipo de dato inesperado: {type(date_str)}")
        return pd.NaT

def generate_daily_balances(df):
    """Genera saldos diarios y clasifica los saldos iniciales y finales por empresa."""
    df = df[df["estado_pago"].str.lower() != "cancelado"]
    df = df.sort_values("fecha_vencimiento")
    df["fecha_vencimiento"] = pd.to_datetime(df["fecha_vencimiento"]).dt.date

    previous_balance = 0
    last_empresa = ""

    new_rows = []
    for current_date in pd.date_range(df['fecha_vencimiento'].min(), df['fecha_vencimiento'].max()).date:
        day_data = df[df["fecha_vencimiento"] == current_date]
        day_transactions_sum = day_data["total"].sum()

        if not day_data.empty:
            last_empresa = day_data["empresa"].iloc[0]

        new_rows.append({
            "numero": "",
            "nombre_socio": "SALDO INICIAL",
            "fecha_factura": current_date,
            "fecha_vencimiento": current_date,
            "total": previous_balance,
            "empresa": last_empresa
        })

        saldo_final = previous_balance + day_transactions_sum
        new_rows.append({
            "numero": "",
            "nombre_socio": "SALDO FINAL",
            "fecha_factura": current_date,
            "fecha_vencimiento": current_date,
            "total": saldo_final,
            "empresa": last_empresa
        })

        previous_balance = saldo_final

    df_new = pd.DataFrame(new_rows)
    df = pd.concat([df_new, df]).sort_values(["fecha_vencimiento", "nombre_socio"]).reset_index(drop=True)
    return df

def classify_transactions(df):
    """Clasifica las transacciones en ingresos, egresos, saldo inicial o saldo final."""
    def get_transaction_type(row):
        if row["nombre_socio"].strip().upper() == "SALDO INICIAL":
            return "SALDO INICIAL"
        elif row["nombre_socio"].strip().upper() == "SALDO FINAL":
            return "SALDO FINAL"
        return "Ingreso" if row["total"] >= 0 else "Egreso"

    df["tipo_transaccion"] = df.apply(get_transaction_type, axis=1)
    return df

def determine_company(file_name):
    """Determina la empresa en función del nombre del archivo."""
    file_name_lower = file_name.lower()
    if "services" in file_name_lower:
        return "services"
    elif "privada" in file_name_lower:
        return "privada"
    return "Otra Empresa"

def calcular_hash_archivo(file_path):
    """Calcula el hash SHA-256 de un archivo."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def archivo_ya_procesado(hash_archivo):
    """Verifica si el archivo ya ha sido procesado."""
    query = text("SELECT COUNT(1) FROM files WHERE hash_archivo = :hash_archivo")
    with engine.connect() as connection:
        result = connection.execute(query, {"hash_archivo": hash_archivo})
        count = result.scalar()
    return count > 0

def registrar_archivo_procesado(df_archivos):
    """Registra los archivos como procesados desde un DataFrame."""
    try:
        print(f"Preparando para insertar archivos.")
        df_archivos.to_sql('files', con=engine, if_exists='append', index=False)
        print("Archivos registrados con éxito.")
    except Exception as e:
        print(f"Error al registrar archivos: {e}")

def main(file_path):
    """Procesa el archivo y guarda los datos en la base de datos."""
    hash_archivo = calcular_hash_archivo(file_path)
    file_name = file_path.split("/")[-1]
    mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if file_path.endswith(".xlsx") else "text/csv"
    file_size = os.path.getsize(file_path)

    print(f"Hash del archivo: {hash_archivo}")
    print(f"Nombre del archivo: {file_name}")
    print(f"Ruta del archivo: {file_path}")
    print(f"Tipo MIME: {mime_type}")
    print(f"Tamaño del archivo: {file_size}")

    if archivo_ya_procesado(hash_archivo):
        print(f"El archivo '{file_path}' ya ha sido procesado anteriormente.")
        return

    df = process_file(file_path)
    if df is not None:
        empresa = determine_company(file_path)
        df["empresa"] = empresa

        if "Fecha de Factura/Recibo" in df.columns and "Fecha de vencimiento" in df.columns:
            df["Fecha de Factura/Recibo"] = df["Fecha de Factura/Recibo"].apply(
                lambda x: convert_to_datetime(x) if isinstance(x, str) else x
            )
            df["Fecha de vencimiento"] = df["Fecha de vencimiento"].apply(
                lambda x: convert_to_datetime(x) if isinstance(x, str) else x
            )

            df.drop_duplicates(inplace=True)

            df.rename(
                columns={
                    "Número": "numero",
                    "Nombre del socio a mostrar en la factura.": "nombre_socio",
                    "Fecha de Factura/Recibo": "fecha_factura",
                    "Fecha de vencimiento": "fecha_vencimiento",
                    "Referencia": "referencia",
                    "Actividades": "actividades",
                    "Importe sin impuestos con signo": "importe_sin_impuestos",
                    "Impuestos con signo": "impuestos",
                    "Total con signo": "total",
                    "Total en divisa con signo": "total_en_divisa",
                    "Importe adeudado con signo": "importe_adeudado",
                    "Estado de pago": "estado_pago",
                    "Estado": "estado",
                },
                inplace=True,
            )

            current_time = datetime.now()
            df["created_at"] = current_time
            df["updated_at"] = current_time
            df["estado_g"] = "activo"
            df["tipo"] = "Faturado"

            df = generate_daily_balances(df)
            df = classify_transactions(df)

            table_name = "facturas"
            try:
                df.to_sql(table_name, con=engine, if_exists="append", index=False)
                print("Datos enviados a la base de datos con éxito.")
            except Exception as e:
                print(f"Error al insertar datos en la tabla {table_name}: {e}")

            # Crear DataFrame para archivos procesados
            df_files = pd.DataFrame([{
                "filename": file_name,
                "path": file_path,
                "mimetype": mime_type,
                "size": file_size,
                "hash_archivo": hash_archivo
            }])

            registrar_archivo_procesado(df_files)
        else:
            print("Las columnas 'Fecha de Factura/Recibo' o 'Fecha de vencimiento' no se encuentran en el DataFrame.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <file_path>")
    else:
        main(sys.argv[1])
