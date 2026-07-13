# GIG Platform Authentication API Reference

This reference outlines the endpoints, request payloads, and authorization requirements for the Authentication module.

All routes are prefixed by the base API URL: `http://localhost:5000/api/v1`

---

## 1. Register User

*   **URL:** `/auth/register`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePassword123!",
      "name": "Jane Doe"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "User registered successfully.",
      "user": {
        "id": "cmrgh2imd0009cxmtnedzgk1t",
        "email": "user@example.com",
        "name": "Jane Doe",
        "role": "USER",
        "balance": 0,
        "isEmailVerified": false
      }
    }
    ```

---

## 2. Login User

*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Login successful.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "cmrgh2imd0009cxmtnedzgk1t",
        "email": "user@example.com",
        "name": "Jane Doe",
        "role": "USER"
      }
    }
    ```

---

## 3. Request Password Reset

*   **URL:** `/auth/forgot-password`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Password reset token sent to your email."
    }
    ```

---

## 4. Reset Password

*   **URL:** `/auth/reset-password`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "token": "d7f1bbf44713968ff6b6a8d22b7402ed1640b25d...",
      "newPassword": "MyNewSecurePassword456!"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Password has been reset successfully."
    }
    ```

---

## 5. Request Email Verification Link

*   **URL:** `/auth/verify-email/request`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
*   **Request Body:** None
*   **Response (200 OK):**
    ```json
    {
      "message": "Verification email sent."
    }
    ```

---

## 6. Verify Email Address

*   **URL:** `/auth/verify-email`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `token` (String, Required)
*   **Request Example:** `/auth/verify-email?token=723dffdf2477862590c766787387c3a885fc042751f...`
*   **Response (200 OK):**
    ```json
    {
      "message": "Email verified successfully."
    }
    ```

---

## 7. Get Current User Profile (`/me`)

*   **URL:** `/auth/me`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "id": "cmrgh2imd0009cxmtnedzgk1t",
        "email": "user@example.com",
        "name": "Jane Doe",
        "role": "USER",
        "balance": 500.0,
        "isActive": true,
        "isEmailVerified": true,
        "createdAt": "2026-07-11T14:15:30.000Z",
        "updatedAt": "2026-07-11T14:16:00.000Z"
      }
    }
    ```

---

## 8. Update Profile

*   **URL:** `/auth/me`
*   **Method:** `PATCH`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "name": "Jane Smith"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Profile updated successfully.",
      "user": {
        "id": "cmrgh2imd0009cxmtnedzgk1t",
        "email": "user@example.com",
        "name": "Jane Smith",
        "role": "USER",
        "balance": 500.0,
        "isActive": true,
        "isEmailVerified": true
      }
    }
    ```
