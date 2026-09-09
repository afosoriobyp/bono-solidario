// Registra todos los modelos de Mongoose al importar este módulo.
// Importar este barrel garantiza que cualquier conexión tenga todos los
// modelos registrados (evita "Schema hasn't been registered" en serverless).
import "./User";
import "./Bono";
import "./Venta";
import "./Carrito";
import "./Notification";
import "./EmailQueue";

export {};