from sqlalchemy import create_engine

# Configura la conexión a la base de datos MariaDB
DATABASE_URI = "mysql+pymysql://userDBFlujoCaja:&%Kuin899675GTRE*$kjhPOWqe@10.10.12.221:3306/flujo_de_caja"

# Crear la instancia de engine
engine = create_engine(DATABASE_URI)

# Puedes agregar más funciones de utilidad si es necesario, como para verificar la conexión
def get_engine():
    return engine