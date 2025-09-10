
# Secure PII Vault

**Secure PII Vault** is a full-stack web application designed to securely store, manage, and access Personally Identifiable Information (PII).
The system is built with a FastAPI backend, a React frontend, and a MySQL database, providing a secure and scalable architecture with encryption, authentication, and role-based access control.

---

## Features

* **Secure Authentication**

  * User registration and login with reCAPTCHA validation
  * Role-based access (User and Admin)

* **Encryption and Data Protection**

  * AES-GCM encryption for sensitive data
  * Key management and secure storage of encryption keys

* **Database Management**

  * MySQL database schema for structured storage
  * Separate tables for users, keys, and encrypted PII

* **Admin Dashboard**

  * Manage user roles and accounts
  * Monitor stored data and system usage

* **Frontend Application**

  * React-based responsive interface
  * Modern UI with user-friendly workflows

* **Backend API**

  * Built with FastAPI for high performance
  * REST endpoints for authentication, data encryption, and retrieval

---

## Project Structure

```
SECURE-VAULT/
│── backend/        # FastAPI backend (Python)
│── frontend/       # React frontend (Vite + Tailwind)
│── sql.txt         # MySQL database schema
│── README.md       # Project documentation
```

---

## Prerequisites

Ensure the following are installed on your system before setup:

* Python 3.10 or newer
* Node.js 18 or newer (with npm)
* MySQL Server and MySQL Workbench

---

## Setup Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Edit the `.env` file in the backend directory and update the following:

```env
MYSQL_PASSWORD=your_mysql_root_password
```

Other variables such as reCAPTCHA, Azure, and SMTP are preconfigured but can be modified if needed.

---

### 2. Database Setup

1. Open **MySQL Workbench** and connect to your local instance.
2. Open `sql.txt` and execute the script to create all required databases and tables.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm install jwt-decode
```

A separate `.env` file is not required for the frontend. The reCAPTCHA site key is already included.

---

### 4. Running the Application

* **Start the Backend**

  ```bash
  cd backend
  uvicorn main:app --host 0.0.0.0 --port 8080 --reload
  ```

  The backend API will be available at: `http://localhost:8080`

* **Start the Frontend**

  ```bash
  cd frontend
  npm run dev
  ```

  The application will be available at: `http://localhost:5173`

---

### 5. Creating an Admin User

By default, all registered users are assigned the role `user`. To promote a user to `admin`:

1. Register a new account via the web interface.
2. In **MySQL Workbench**, execute the following command (replace the email with the registered account):

```sql
UPDATE pii_db.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

If you encounter errors when executing, remove the quotes and type the values manually.

Once updated, logging in with this account will provide access to the **Admin Dashboard**.

---

Do you also want me to create a **shorter version** of this README (one-page summary) for your GitHub front page, while keeping this detailed one inside a `docs/SETUP.md` file? That way the repo looks cleaner for visitors.
