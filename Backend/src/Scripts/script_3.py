import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import sys
import os
from db import get_engine


engine = get_engine()


def process_file(file_path):
    """Lee un archivo Excel o CSV y retorna un DataFrame con encabezados limpios."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path, header=1)  # Leemos desde la segunda fila como encabezado
        df = df.dropna(how='all')  # Eliminamos filas completamente vacías
    elif file_path.endswith(".xlsx"):
        df = pd.read_excel(file_path, header=1)  # Leemos desde la segunda fila como encabezado
        df = df.dropna(how='all')  # Eliminamos filas completamente vacías
    else:
        raise ValueError("Unsupported file type")
    
    # Filtramos cualquier fila que pueda contener "Saldo inicial"
    df = df[df["Unnamed: 0"] != "Saldo inicial"]
    
    print(f"Columnas en el archivo {file_path}: {df.columns}")
    return df


def validate_columns(df, required_columns):
    """Valida si las columnas requeridas están presentes en el DataFrame."""
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        print(f"Advertencia: Faltan las saiguientes columnas en el archivo: {', '.join(missing_columns)}")
        return False
    print("Todas las columnas requeridas están presentes.")
    return True

def identif(df):
    # Validar que las columnas 'Fecha', 'Unnamed: 0' y otras necesarias estén en el DataFrame
    required_columns = ['Fecha', 'Unnamed: 0']
    if not validate_columns(df, required_columns):
        return df  # Retorna el DataFrame original si las columnas están incompletas

    df["Es_cuenta_contable"] = df["Fecha"].isna() & df["Unnamed: 0"].notna()
    df["Cuenta_contable"] = df["Unnamed: 0"].where(df["Es_cuenta_contable"]).ffill()
    facturas_df = df[~df["Es_cuenta_contable"]].copy()
    return facturas_df


def select(columns, names, df):
    """Selecciona las columnas especificadas y renombra las columnas en el DataFrame."""
    facturas_df = df[columns]  # Seleccionamos solo las columnas que nos interesan
    facturas_df.columns = names  # Renombramos las columnas
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
    # Definir las columnas que queremos mantener y sus nuevos nombres
    columns = [
        "Unnamed: 0",  # Esta parece ser la columna de facturas
        "Fecha",  # Columna de fechas
        "Cuenta_contable",  # Columna creada en 'identif'
    ]
    names = [
        "factura",  # Renombramos 'Unnamed: 0' a 'factura'
        "fecha",  # Renombramos 'Fecha' a 'fecha'
        "cuenta_contable",  # Ya está como 'Cuenta_contable', solo lo mantenemos
    ]
    
    table_name = "cuentas_contables"  # Cambiar esto si es necesario

    if os.path.isfile(input_path):  # Verifica si es un archivo
        df = process_file(input_path)
        df = identif(df)
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