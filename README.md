# Random Number Generator with Authentication and CRUD Operations

This project is a full-stack application that includes a backend built with **Python (FastAPI)** and a frontend built with **React**. The application provides real-time random number generation, authentication, and CRUD operations on a CSV file. Below is a detailed guide to set up, use, and deploy the application.

---

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Setup Instructions](#setup-instructions)
4. [Testing Steps](#testing-steps)
5. [Hosted Links](#hosted-links)

---

## Features

### Backend
- **Authentication**: Basic authentication with username and password. Session tokens (JWT) are issued and validated for protected endpoints.
- **Random Number Generator**: Generates random numbers every second and stores them in a database (MySQL) with timestamps as keys.
- **API Endpoints**:
  - **Login Endpoint**: Issues tokens for authentication.
  - **Real-Time Data Streaming**: Provides a WebSocket or REST endpoint to stream random numbers (requires authentication).
  - **CSV File Fetch**: Fetches the `backend_table.csv` file (requires authentication).
  - **CRUD Operations**: Allows users to perform Create, Read, Update, and Delete operations on `backend_table.csv`.
- **Concurrency Management**: Implements file locking to handle simultaneous CRUD operations.
- **Recovery Mechanism**: Creates a backup of `backend_table.csv` before overwriting it.

### Frontend
- **Authentication**: Login page for username and password input. Session tokens are stored using state management libraries (Redux for React).
- **Main Application**:
  - **Interactive Plot**: Displays real-time streamed random numbers using Chart.js.
  - **Dynamic Table**: Shows stored numbers and records in a paginated, sortable table.
  - **CRUD Interface**: Allows users to perform CRUD operations on `backend_table.csv`.
- **Dynamic Updates**: Real-time data streaming updates the plot and table dynamically.
- **Error Handling**: Displays errors for failed logins, unauthorized actions, or conflicting CRUD operations.
- **Session Persistence**: Uses `localStorage` to maintain the user session.
- **Recovery UI**: Provides an option to restore data from the most recent backup file.

---

## Tech Stack

### Backend
- **Language**: Python
- **Framework**: FastAPI
- **Database**: MySQL
- **Hosting**: Render

### Frontend
- **Framework**: React
- **State Management**: Redux (React)
- **Charting Library**: Chart.js
- **Hosting**: Vercel

---

## Setup Instructions

### Backend
1. Clone the repository:
   ```bash
   git clone https://github.com/Kushagra0426/blackrose.git
   cd Backend
   ```

2. Install dependencies:
    ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
    Make a .env file in the root directory of backend with following content:

    ```bash
    SECRET_KEY="your-secret-key-for-token-hashing"
    CSV_FILE="your-csv-file-name.csv"
    DB_HOST="your-mysql-db-hostname"
    DB_PORT="your-mysql-db-port"
    DB_USER="your-mysql-db-username"
    DB_PASSWORD="your-mysql-db-password"
    ```

4. Run the backend server:
    ```bash
    uvicorn main:app --reload
    ```

### Frontend
1. Navigate to the frontend directory:
    ```bash
    cd Frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Set up environment variables:
    Make a .env file in the root directory of backend with following content:

    ```bash
    VITE_APP_BACKEND_URL=your-backend-url
    VITE_APP_WEB_SOCKET_URL=your-frontend-url
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```

---

## Testing Steps

## Authentication

1. Open the login page and enter any username and password.

2. Verify that a session token is issued and stored in the Local Storage of your browser.

3. Attempt to access protected endpoints without a token to ensure they are restricted.

## Real-Time Data Visualization

1. Navigate to the Dashboard.

2. Verify that random numbers are streamed and displayed in real-time in the chart.

## CRUD Operations

1. Perform Create, Read, Update, and Delete operations on backend_table.csv, by clicking on the relevant option in the table.

2. Verify that changes are persisted and reflected in the UI.

3. Test concurrency by performing simultaneous CRUD operations from multiple sessions.

---

## Hosted Links

- Website: https://blackrose-d222.vercel.app

---

Made with ❤️ by Kushagra Saxena

<a href="https://www.linkedin.com/in/kushagra-saxena-7602b3204/" target="_blank"> <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"> </a><a href="https://kushagra-portfolio-ivory.vercel.app/" target="_blank"> <img src="https://img.shields.io/badge/Portfolio-%23000000.svg?style=for-the-badge&logo=react&logoColor=white" alt="Portfolio"> </a>
