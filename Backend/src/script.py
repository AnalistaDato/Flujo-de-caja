import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import sys

# Configura la conexión a la base de datos MariaDB
DATABASE_URI = 'mysql+pymysql://root:@localhost:3306/flujo_de_caja'
engine = create_engine(DATABASE_URI)

def process_file(file_path):
    """
    Lee un archivo CSV o Excel y retorna un DataFrame.
    
    Args:
    file_path (str): Ruta al archivo CSV o Excel.
    
    Returns:
    pd.DataFrame: DataFrame con los datos del archivo.
    """
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith('.xlsx'):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file type")
    return df

def convert_to_datetime(date_str):
    """
    Convierte una cadena de texto con formato 'd/m/Y h:M:S a. m.' o 'd/m/Y h:M:S p. m.'
    a un objeto datetime. Maneja también los valores ya en formato datetime.
    
    Args:
    date_str (str or Timestamp): Cadena de texto con la fecha y hora o un objeto datetime.
    
    Returns:
    datetime: Objeto datetime representando la fecha y hora.
    """
    if pd.isna(date_str):  # Manejar valores NaN
        return pd.NaT
    
    if isinstance(date_str, pd.Timestamp):  # Ya es un objeto datetime
        return date_str.to_pydatetime()
    
    if isinstance(date_str, str):  # Es una cadena de texto
        # Reemplazar 'a. m.' y 'p. m.' por 'AM' y 'PM'
        normalized_date_str = date_str.replace("a. m.", "AM").replace("p. m.", "PM")
        # Convertir la cadena al objeto datetime
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
    """
    Elimina registros duplicados de la tabla en la base de datos,
    manteniendo solo el registro con el número de identificación más alto.
    
    Args:
    table_name (str): Nombre de la tabla en la base de datos.
    engine (Engine): Motor de conexión SQLAlchemy.
    """
    with engine.connect() as conn:
        # Definir la consulta SQL para eliminar duplicados
        sql = f"""
            DELETE t1 FROM {table_name} t1
            INNER JOIN {table_name} t2 
            ON t1.numero = t2.numero 
            WHERE t1.id < t2.id;
        """
        
        try:
            conn.execute(sql)
            print(f"Duplicados eliminados exitosamente de la tabla '{table_name}'.")
        except Exception as e:
            print(f"Error al eliminar duplicados: {e}")

def main(file_path):
    """
    Procesa el archivo y guarda los datos en la base de datos.
    
    Args:
    file_path (str): Ruta al archivo CSV o Excel.
    """
    df = process_file(file_path)
    
    if df is not None:
        # Verificar que las columnas existen
        if 'Fecha de Factura/Recibo' in df.columns and 'Fecha de vencimiento' in df.columns:
            # Aplicar la función solo si el valor no es ya un objeto datetime
            df['Fecha de Factura/Recibo'] = df['Fecha de Factura/Recibo'].apply(lambda x: convert_to_datetime(x) if isinstance(x, str) else x)
            df['Fecha de vencimiento'] = df['Fecha de vencimiento'].apply(lambda x: convert_to_datetime(x) if isinstance(x, str) else x)
            
            # Eliminar duplicados en el DataFrame
            df.drop_duplicates(inplace=True)
            
            # Asegurarse de que las columnas se ajusten a la estructura de la tabla
            df.rename(columns={
                'Número': 'numero',
                'Nombre del socio a mostrar en la factura.': 'nombre_socio',
                'Fecha de Factura/Recibo': 'fecha_factura',
                'Fecha de vencimiento': 'fecha_vencimiento',
                'Referencia':'referencia',
                'Actividades': 'actividades',
                'Importe sin impuestos con signo': 'importe_sin_impuestos',
                'Impuestos con signo': 'impuestos',
                'Total con signo': 'total',
                'Total en divisa con signo': 'total_en_divisa',
                'Importe adeudado con signo': 'importe_adeudado',
                'Estado de pago': 'estado_pago',
                'Estado': 'estado',
            }, inplace=True)
            
            # Añadir columnas de timestamp
            current_time = datetime.now()
            df['created_at'] = current_time
            df['updated_at'] = current_time
            df['estado_g'] = 'activo'
            
            # Guardar el DataFrame en la base de datos MariaDB
            table_name = 'facturas'
            df.to_sql(table_name, con=engine, if_exists='append', index=False)
            
            # Eliminar duplicados en la base de datos
            remove_duplicates_from_db(table_name, engine)
            
            # Imprimir el DataFrame para verificar
            print("Datos enviados a la base de datos con éxito.")
        else:
            print("Las columnas 'Fecha de Factura/Recibo' o 'Fecha de vencimiento' no se encuentran en el DataFrame.")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python script.py <file_path>")
    else:
        main(sys.argv[1])
