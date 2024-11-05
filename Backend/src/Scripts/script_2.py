import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import sys
import os
from db import get_engine


engine = get_engine()

def process_file(file_path):
    """Lee un archivo Excel o CSV y retorna un DataFrame."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    elif file_path.endswith(".xlsx"):
        df = pd.read_excel(file_path)
        df.rename(columns={
            'FECHA': 'fecha',
            'DESCRIPCION': 'descripcion',
            'SUCURSAL': 'sucursal',
            'DCTO.': 'dcto',
            'VALOR': 'valor',
            'SALDO': 'saldo'
        }, inplace=True)
    else:
        raise ValueError("Unsupported file type")
    return df

def convert_to_datetime(date_str):
    """Convierte una cadena de texto con formato a un objeto datetime."""
    if pd.isna(date_str):  # Manejar valores NaN
        return pd.NaT

    if isinstance(date_str, pd.Timestamp):  # Ya es un objeto datetime
        return date_str.to_pydatetime()

    if isinstance(date_str, str):  # Es una cadena de texto
        normalized_date_str = date_str.replace("a. m.", "AM").replace("p. m.", "PM")
        try:
            date_obj = datetime.strptime(normalized_date_str, "%d/%m/%Y %I:%M:%S %p")
        except ValueError as e:
            print(f"Error al convertir la cadena '{date_str}': {e}")
            return pd.NaT
        return date_obj
    else:
        print(f"Tipo de dato inesperado: {type(date_str)}")
        return pd.NaT

def remove_duplicates_from_db(table_name, engine):
    """Elimina registros duplicados de la tabla en la base de datos."""
    with engine.connect() as conn:
        sql = f"""
            DELETE t1 FROM {table_name} t1
            INNER JOIN {table_name} t2 
            ON t1.fecha = t2.fecha AND t1.descripcion = t2.descripcion 
            WHERE t1.id < t2.id;
        """
        try:
            conn.execute(sql)
            print(f"Duplicados eliminados exitosamente de la tabla '{table_name}'.")
        except Exception as e:
            print(f"Error al eliminar duplicados: {e}")

def process_and_store(df, table_name):
    """Procesa el DataFrame y lo guarda en la base de datos."""
    if {"fecha", "descripcion", "valor", "saldo"}.issubset(df.columns):
        # Convertir 'fecha' a datetime
        df["fecha"] = df["fecha"].apply(
            lambda x: convert_to_datetime(x) if isinstance(x, str) else x
        )

        # Convertir 'valor' y 'saldo' a valores numéricos
        df["valor"] = df["valor"].replace({r'[^0-9.-]': ''}, regex=True).astype(float)
        df["saldo"] = df["saldo"].replace({r'[^0-9.-]': ''}, regex=True).astype(float)

        # Filtrar las filas que cumplen con las condiciones
        df_filtered = df[
            df["descripcion"].str.contains(
                "PAGO PSE APORTES EN LINEA|IMPTO GOBIERNO 4X1000|PAGO A NOMIN|COBRO IVA PAGOS AUTOMATICOS", 
                na=False
            )
        ]

        if not df_filtered.empty:
            # Reemplazar "PAGO A NOMIN..." por "PAGO A NOMINA"
            df_filtered.loc[:, "descripcion"] = df_filtered["descripcion"].apply(
                lambda x: "PAGO A NOMINA" if "PAGO A NOMIN" in x else x
            )

            # Agrupar por 'fecha' y 'descripcion', sumar los valores en 'valor', y tomar el valor menor en 'saldo'
            df_grouped = df_filtered.groupby(['fecha', 'descripcion']).agg({
                'valor': 'sum',      # Suma de valores
                'saldo': 'min',      # Valor mínimo de saldo
            }).reset_index()

            # Agregar las columnas 'estado', 'created_at' y 'updated_at'
            df_grouped["estado"] = "activo"
            current_time = datetime.now()
            df_grouped["created_at"] = current_time
            df_grouped["updated_at"] = current_time

            # Guardar en la base de datos
            df_grouped.to_sql(table_name, con=engine, if_exists="append", index=False)
            remove_duplicates_from_db(table_name, engine)

            print(f"Datos procesados y almacenados en la tabla '{table_name}'.")
        else:
            print("No se encontraron filas con las descripciones indicadas.")
    else:
        print("Las columnas requeridas no se encuentran en el DataFrame.")

def main(input_path):
    """Procesa archivos desde un archivo o directorio."""
    table_name = "extracto"  # Cambiar esto si es necesario

    if os.path.isfile(input_path):  # Verifica si es un archivo
        df = process_file(input_path)
        process_and_store(df, table_name)
    elif os.path.isdir(input_path):  # Verifica si es un directorio
        for filename in os.listdir(input_path):
            if filename.endswith(".xlsx") or filename.endswith(".csv"):
                file_path = os.path.join(input_path, filename)
                df = process_file(file_path)
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
