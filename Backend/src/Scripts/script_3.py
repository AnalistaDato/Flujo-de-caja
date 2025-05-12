import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import sys
import os
from db import get_engine
import re

engine = get_engine()


def process_file(file_path):
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path, header=1)
    elif file_path.endswith(".xlsx"):
        df = pd.read_excel(file_path, header=1)
    else:
        raise ValueError("Unsupported file type")

    df = df.drop([0, 0], axis=0).reset_index(drop=True)
    df = df[df["Unnamed: 0"] != "Saldo inicial"]
    return df

def identify_company(file_path):
    # Extraer el nombre del archivo sin la extensión
    file_name = file_path.split("/")[-1].split(".")[0]
    # Normalizar el nombre (minúsculas) y buscar patrones
    normalized_name = file_name.lower()

    # Buscar patrones para determinar la empresa
    if re.search(r"services", normalized_name):
        return "services"
    elif re.search(r"privada", normalized_name):
        return "privada"

    return None

def filter_accounts(df):
    allowed_accounts = {
        "cuenta_contable": [
            "NACIONALES"
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
        ]
    }

    # Filtramos el DataFrame según los detalles y cuentas permitidos
    filtered_df = df[
        df["cuenta_contable"].isin(allowed_accounts["cuenta_contable"])
    ]
    return filtered_df


def validate_columns(df, required_columns):
    """Valida si las columnas requeridas están presentes en el DataFrame."""
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"Advertencia: Faltan las saiguientes columnas en el archivo: {', '.join(missing_columns)}")
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
    facturas_df["cuenta_contable"] = cuenta_detalle[1]

    return facturas_df



def select(columns, names, df):
    facturas_df = df[columns]
    facturas_df.columns = names
    return facturas_df


def process_and_store(df, table_name):
    """Procesa el DataFrame y lo guarda en la base de datos."""
    # Cambiamos a las columnas renombradas
    if {"cuenta_contable", "factura", "fecha"}.issubset(df.columns):
        # Agregar las columnas 'estado', 'created_at' y 'updated_at'
        current_time = datetime.now()
        df["created_at"] = current_time
        df["updated_at"] = current_time

        # Guardar en la base de datos
        df.to_sql(table_name, con=engine, if_exists="append", index=False)
      

        print(f"Datos procesados y almacenados en la tabla '{table_name}'.")
    else:
        print(f"Las columnas requeridas no se encuentran en el DataFrame: {df.columns}")


def main(input_path):
    
    company = identify_company(input_path)
    
    if company is None:
        print("El archivo no pertenece a 'services' ni 'privada'. No se procesará.")
        return
    # Definir las columnas que queremos mantener y sus nuevos nombres
    columns = [
        "Unnamed: 0",  # Esta parece ser la columna de facturas
        "Unnamed: 1",  # Columna de fechas
        "cuenta_contable",
        "empresa"
    ]
    names = [
        "factura",  # Renombramos 'Unnamed: 0' a 'factura'
        "fecha",  # Renombramos 'fecha' a 'fecha'
        "cuenta_contable",  # Ya está como 'Cuenta_contable', solo lo mantenemos
        "empresa"
    ]
    
    table_name = "cuentas_contables"  # Cambiar esto si es necesario

    if os.path.isfile(input_path):  # Verifica si es un archivo
        df = process_file(input_path)
        df = identif(df)
        df = filter_accounts(df)
        df["empresa"] = identify_company(input_path)
        df = df.drop_duplicates()  # Eliminar duplicados
        print(df.columns)  # Para ver todas las columnas del DataFrame
        print(df['empresa'].isnull().sum())  # Para contar valores nulos en la columna 'empresa'
        df = select(columns, names, df)  # Selecciona y renombra las columnas
        print("DataFrame después de seleccionar y renombrar columnas:")
        print(df)  # Aquí se imprime el DataFrame después de seleccionar y renombrar
        if df is not None:
            process_and_store(df, table_name)
    elif os.path.isdir(input_path):  # Verifica si es un directorio
        for filename in os.listdir(input_path):
            if filename.endswith(".xlsx") or filename.endswith(".csv"):
                file_path = os.path.join(input_path, filename)
                df = process_file(file_path)
                df = identif(df)
                df = filter_accounts(df)
                df["empresa"] = identify_company(input_path)
                df = df.drop_duplicates()  # Eliminar duplicados
                df = select(columns, names, df)  # Selecciona y renombra las columnas
                print("DataFrame después de seleccionar y renombrar columnas:")
                print(df)  # Aquí se imprime el DataFrame después de seleccionar y renombrar
                if df is not None:
                    process_and_store(df, table_name)
            else:
                print(f"Archivo no soportado: {filename}")
    else:
        print(f"La ruta proporcionada no es válida: {input_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python script.py <ruta_archivo_o_directorio>")
    else:
        main(sys.argv[1])