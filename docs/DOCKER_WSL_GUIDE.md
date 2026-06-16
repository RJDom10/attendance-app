# Guía de Ejecución con Docker y WSL

Esta guía describe el flujo paso a paso para ejecutar el proyecto (Backend + Frontend) utilizando **Docker** y **Windows Subsystem for Linux (WSL)**, garantizando que todo el sistema opere en un espacio aislado sin instalar dependencias directamente en tu sistema.

---

## 1. Requisitos Previos

1. Tener instalado [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install).
2. Tener instalado [Docker Desktop para Windows](https://docs.docker.com/desktop/windows/install/).
3. Asegurarse de que en la configuración de Docker Desktop (Settings > Resources > WSL Integration) esté habilitada la integración con tu distribución de Linux (ej. Ubuntu).

---

## 2. Flujo Paso a Paso

### Paso 1: Clonar/Abrir el proyecto en WSL
Aunque puedes correr comandos desde PowerShell (si la integración está habilitada), lo ideal es operar dentro del propio WSL:
```bash
# Abrir tu terminal de WSL (por ejemplo, Ubuntu)
# Navegar hasta el directorio del proyecto
cd /mnt/c/Users/HP/Documents/attendance-app
```

### Paso 2: Iniciar Docker Desktop
Asegúrate de que la aplicación **Docker Desktop** esté abierta y ejecutándose (el icono de la ballena en la barra de tareas debe estar verde/activo). Si el motor (daemon) no está corriendo, los comandos de Docker fallarán indicando que no pueden conectarse.

### Paso 3: Levantar los Contenedores
Ejecuta el siguiente comando en la raíz del proyecto (donde se ubica el archivo `docker-compose.yml`):

```bash
docker-compose up --build -d
```
> **Nota:** 
> - `--build`: Fuerza la reconstrucción de las imágenes de los contenedores (Frontend de Node y Backend de Python) para asegurar que tengan el código más reciente.
> - `-d`: Ejecuta los contenedores en segundo plano (detached mode), liberando tu terminal.

### Paso 4: Verificar el Estado
Para comprobar que los servicios están funcionando correctamente:
```bash
docker-compose ps
```
Deberías ver dos servicios en estado "Up" (corriendo):
- `attendance-backend` mapeado al puerto `8000`
- `attendance-frontend` mapeado al puerto `5173`

---

## 3. Acceder a la Aplicación

Una vez que los contenedores estén corriendo, la aplicación está disponible como si estuviera nativa en tu PC:
- **Frontend (Aplicación Web):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 4. Comandos Útiles

- **Ver los logs de los contenedores:**
  ```bash
  docker-compose logs -f
  ```
  *(Presiona `Ctrl + C` para salir de la vista de logs)*

- **Detener los servidores:**
  Para apagar y detener los contenedores (sin borrar los datos):
  ```bash
  docker-compose stop
  ```

- **Eliminar los contenedores:**
  Para detener todo y eliminar los contenedores (la base de datos se conservará gracias a los volúmenes definidos):
  ```bash
  docker-compose down
  ```
