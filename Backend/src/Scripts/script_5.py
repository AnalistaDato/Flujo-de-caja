import pandas as pd
from datetime import datetime
import sys
from db import get_engine

engine = get_engine()


def process_file(file_path):
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path, header=1)
    elif file_path.endswith(".xlsx"):
        df = pd.read_excel(file_path, header=1)
    else:
        raise ValueError("Unsupported file type")

    df = df.dropna(how="all")
    df = df[df["Unnamed: 0"] != "Saldo inicial"]
    return df


def validate_columns(df, required_columns):
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(
            f"Advertencia: Faltan las siguientes columnas en el archivo: {', '.join(missing_columns)}"
        )
        return False
    print("Todas las columnas requeridas están presentes.")
    return True


def identif(df):
    required_columns = ["Unnamed: 0", "Unnamed: 1"]
    if not validate_columns(df, required_columns):
        return df

    df["Es_cuenta_contable"] = df["Unnamed: 1"].isna() & df["Unnamed: 0"].notna()
    df["Cuenta_contable"] = df["Unnamed: 0"].where(df["Es_cuenta_contable"]).ffill()
    facturas_df = df[~df["Es_cuenta_contable"]].copy()

    # Separar cuenta y detalle
    cuenta_detalle = facturas_df["Cuenta_contable"].str.split(" ", n=1, expand=True)
    facturas_df["cuenta"] = cuenta_detalle[0]
    facturas_df["detalle"] = cuenta_detalle[1]

    return facturas_df


def select(columns, names, df):
    facturas_df = df[columns]
    facturas_df.columns = names
    return facturas_df


def filter_accounts(df):
    allowed_accounts = {
        "detalle": [
            "JEEVES",
            "BANCOLOMBIA 8986",
            "BANCOLOMBIA 9918",
            "BANCOLOMBIA ROTATIVO 0115",
            "BANCOLOMBIA ROTATIVO 1053",
            "BANCOLOMBIA 9404",
            "BANCOLOMBIA 0353",
            "CREDIPAGO VIRTUAL 3264",
            "CESANTIAS 2023 0334",
            "BANCOLOMBIA 3770",
            "BANCOLOMBIA t. credito COP 4428",
            "PROVEEDORES NACIONALES",
            "INTERCOMPAÑIAS",
            "GASTOS LEGALES",
            "HONORARIOS",
            "SERVICIOS TECNICOS",
            "ARRENDAMIENTOS",
            "TRANSPORTES, FLETES Y ACARREOS",
            "SERVICIOS PUBLICOS",
            "SEGUROS",
            "SEGUROS (ASCENSION)",
            "GASTOS DE VIAJE",
            "CASINO Y RESTAURANTE",
            "ELEMENTOS DE ASEO Y CAFETERIA",
            "OTROS BIENES O SERVICIOS",
            "EXAMENES DE INGRESO",
            "LIQUIDACIONES POR PAGAR",
            "CXP EDUARDO RODRIGUES",
            "CXP MAURICIO HERNANDEZ",
            "RTE FTE 2022",
            "RTE FTE 2023",
            "RTE FTE 2024",
            "RTE ICA POR PAGAR 2017",
            "RTE ICA POR PAGAR AÑOS ANTERIORES",
            "RTE ICA POR PAGAR 2022",
            "RTE ICA POR PAGAR 2023",
            "RTE ICA POR PAGAR 2024",
            "IMPUESTO DE RENTA Y COMPLEMENTARIOS 2019",
            "IMPUESTO DE RENTA Y COMPLEMENTARIOS 2022",
            "IMPUESTO DE RENTA Y COMPLEMENTARIOS 2023",
            "IVA POR PAGAR 2019",
            "IVA POR PAGAR 2020",
            "IVA POR PAGAR 2021",
            "IVA POR PAGAR 2022",
            "ICA POR PAGAR 2023",
            "ICA POR PAGAR 2024",
            "ICA PERIODO ANTERIOR",
            "APORTES EN LINEA",
            "NOMINA POR PAGAR",
            "CESANTIAS",
            "INTERESES SOBRE CESANTIAS",
            "PRIMA POR PAGAR",
            "VACACIONES POR PAGAR",
            "DE CLIENTES",
        ],
        "cuenta": [
            "21050502",
            "21051004",
            "21051006",
            "21051007",
            "21051008",
            "21051009",
            "21051017",
            "21051018",
            "21051019",
            "21051020",
            "21051502",
            "22050501",
            "23150101",
            "23351001",
            "23352501",
            "23353001",
            "23354001",
            "23354501",
            "23355001",
            "23355501",
            "23355502",
            "23356001",
            "23359001",
            "23359002",
            "23359501",
            "23359502",
            "23359507",
            "23551001",
            "23551003",
            "23655013",
            "23655014",
            "23655015",
            "23681805",
            "23681806",
            "23681807",
            "23681808",
            "23681809",
            "24040502",
            "24040503",
            "24040504",
            "24082503",
            "24082504",
            "24082505",
            "24082506",
            "24120502",
            "24120503",
            "24122501",
            "23705001",
            "25050501",
            "25101001",
            "25150501",
            "25200502",
            "25250502",
            "28050501",
        ],
    }

    # Filtramos el DataFrame según los detalles y cuentas permitidos
    filtered_df = df[
        df["detalle"].isin(allowed_accounts["detalle"])
        | df["cuenta"].isin(allowed_accounts["cuenta"])
    ]
    return filtered_df


def link_transactions(df):
    # Filtrar las filas donde "comunicacion" está vacío
    df = df[pd.notnull(df["comunicacion"]) & (df["comunicacion"].str.strip() != "")]
    
    # Si no hay filas para procesar, devolver df vacío
    if df.empty:
        print("No hay transacciones para procesar debido a la falta de comunicación.")
        return df

    bnk_transactions = df[df["factura"].str.startswith("BNK")].copy()

    def find_related_transactions(row):
        related_invoices = []
        comm_invoices = row["comunicacion"].split(" - ")
        for invoice in comm_invoices:
            if "BNK" in invoice:
                continue
            for bnk_row in bnk_transactions.itertuples():
                if (
                    pd.notnull(bnk_row.comunicacion)
                    and invoice in bnk_row.comunicacion
                ):
                    related_invoices.append(bnk_row.factura)
        return list(set(related_invoices))

    df["related_invoices"] = df.apply(find_related_transactions, axis=1)

    def assign_bank(related_invoices):
        if not related_invoices:
            return None
        for invoice in related_invoices:
            if invoice.startswith("BNK0"):
                return "BANCOLOMBIA"
            elif invoice.startswith("BNK01"):
                return "BANCO CAJA SOCIAL S.A."
            elif invoice.startswith("BNK2"):
                return "BANCOLOMBIA"
        return None

    df["banco"] = df["related_invoices"].apply(assign_bank)

    # Asignar "No asignado" a las filas sin banco relacionado
    df["banco"] = df["banco"].fillna("No asignado")

    return df


def link_transactions(df):
    # Filtrar las filas donde "comunicacion" está vacío y hacer una copia
    df_filtered = df[pd.notnull(df["comunicacion"]) & (df["comunicacion"].str.strip() != "")].copy()
    
    # Si no hay filas para procesar, devolver df vacío
    if df_filtered.empty:
        print("No hay transacciones para procesar debido a la falta de comunicación.")
        return df_filtered

    bnk_transactions = df_filtered[df_filtered["factura"].str.startswith("BNK")].copy()

    def find_related_transactions(row):
        related_invoices = []
        comm_invoices = row["comunicacion"].split(" - ")
        for invoice in comm_invoices:
            if "BNK" in invoice:
                continue
            for bnk_row in bnk_transactions.itertuples():
                if (
                    pd.notnull(bnk_row.comunicacion)
                    and invoice in bnk_row.comunicacion
                ):
                    related_invoices.append(bnk_row.factura)
        return list(set(related_invoices))

    # Usar .loc para evitar SettingWithCopyWarning
    df_filtered.loc[:, "related_invoices"] = df_filtered.apply(find_related_transactions, axis=1)

    def assign_bank(related_invoices):
        if not related_invoices:
            return None
        for invoice in related_invoices:
            if invoice.startswith("BNK0"):
                return "BANCOLOMBIA"
            elif invoice.startswith("BNK01"):
                return "BANCO CAJA SOCIAL S.A."
            elif invoice.startswith("BNK2"):
                return "BANCOLOMBIA"
        return None

    # Usar .loc para evitar SettingWithCopyWarning
    df_filtered.loc[:, "banco"] = df_filtered["related_invoices"].apply(assign_bank)

    # Asignar "No asignado" a las filas sin banco relacionado
    df_filtered.loc[:, "banco"] = df_filtered["banco"].fillna("No asignado")

    return df_filtered

def process_and_store(df, table_name):
    required_columns = ["factura", "fecha", "cuenta", "detalle", "debito", "credito","socio","banco"]
    if all(col in df.columns for col in required_columns):
        current_time = datetime.now()
        df["created_at"] = current_time
        df["updated_at"] = current_time

        # Prepara los datos para la inserción
        data_to_insert = df[required_columns].copy()

        # Imprimir el tamaño y el contenido del DataFrame que se va a insertar
        print(
            f"Tamaño del DataFrame a insertar: {data_to_insert.shape[0]} filas y {data_to_insert.shape[1]} columnas"
        )
        print(
            data_to_insert.head()
        )  # Imprimir las primeras filas para ver el contenido

        # Almacenar los datos en la base de datos
        try:
            data_to_insert.to_sql(
                table_name,
                con=engine,
                if_exists="append",
                index=False,  # Quitar method="multi"
            )
            print(f"Datos procesados y almacenados en la tabla '{table_name}'.")
        except Exception as e:
            print(f"Error al almacenar datos en la base de datos: {e}")
    else:
        print(f"Las columnas requeridas no se encuentran en el DataFrame: {df.columns}")


def main(input_path):
    columns = [
        "Unnamed: 0",
        "Unnamed: 1",
        "cuenta",
        "detalle",
        "Unnamed: 5",
        "Unnamed: 6",
        "Unnamed: 2",
        "Unnamed: 3",
    ]
    names = [
        "factura",
        "fecha",
        "cuenta",
        "detalle",
        "debito",
        "credito",
        "comunicacion",
        "socio",
    ]

    table_name = "facturas_consolidadas"

    df = process_file(input_path)
    df = identif(df)
    df = select(columns, names, df)
    df = filter_accounts(df)
     # Guardar el DataFrame procesado a un archivo Excel
    output_file = "C:/Users/Analista De Datos/Desktop/Definitivo/Backend/consolidacion/output.xlsx"
    df = link_transactions(df)
    df.to_excel(output_file, index=False)
    print(f"Datos guardados en: {output_file}")
    print(
        f"Tamaño del DataFrame después de identif: {df.shape[0]} filas y {df.shape[1]} columnas"
    )

    # Llamada para almacenar los datos en la base de datos
    process_and_store(df, table_name)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python script.py <ruta_archivo_entrada>")
    else:
        main(sys.argv[1])