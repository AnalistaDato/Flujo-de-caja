import pandas as pd
import sys
from sqlalchemy import text
from db import get_engine

# Establece la conexión a la base de datos
engine = get_engine()


def process_file(file_path):
    # Cargar el archivo dependiendo del formato (CSV o Excel)
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path, header=0, sep=",")
    elif file_path.endswith(".xlsx"):
        df = pd.read_excel(file_path, header=0)
    else:
        raise ValueError("Unsupported file type")

    # Eliminar espacios en blanco de los nombres de las columnas
    df.columns = df.columns.str.strip()

    # Clasificar transacciones según las columnas 'debito' y 'credito'
    df["tipo_transaccion"] = df.apply(
        lambda row: (
            "ingreso"
            if pd.notnull(row.get("credito")) and pd.isnull(row.get("debito"))
            else (
                "egreso"
                if pd.notnull(row.get("debito")) and pd.isnull(row.get("credito"))
                else "otro"
            )
        ),
        axis=1,
    )
    df["estado"] = "proyectado"

    return df


def save_to_database(df, table_name):
    # Verifica si el DataFrame está vacío
    if df.empty:
        print("El DataFrame está vacío. No hay datos para guardar.")
        return

    # Guarda el DataFrame en la base de datos, en la tabla especificada
    try:
        df.to_sql(
            table_name, con=engine, if_exists="append", index=False, method="multi"
        )
        print("Datos guardados exitosamente en la base de datos.")
    except Exception as e:
        print(f"Error al guardar en la base de datos: {e}")


if __name__ == "__main__":
    # Obtiene la ruta del archivo desde la línea de comandos
    if len(sys.argv) < 2:
        print("Por favor, proporciona la ruta del archivo como argumento.")
        sys.exit(1)

    file_path = sys.argv[1]

    # Procesa el archivo y guarda el DataFrame resultante
    df = process_file(file_path)

    # Muestra información del DataFrame
    print("Contenido del DataFrame:")
    print(df.head())  # Muestra las primeras filas del DataFrame

    # Define el nombre de la tabla
    table_name = "facturas_consolidadas"  # Cambia esto al nombre de la tabla que deseas en la base de datos
    # Guarda el DataFrame en la base de datos
    save_to_database(df, table_name)
