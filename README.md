# TRINETRA AI – Smart Safety System for Women and Children

## 📌 About the Project

TRINETRA AI is an AI-powered smart safety system designed to improve the safety of women and children using a wearable wristband. It combines real-time GPS tracking, heart-rate monitoring, voice-based distress detection, and an emergency SOS button to help identify potential emergency situations.

When a distress situation is detected or the SOS button is pressed, the system can generate an emergency alert with location information for the registered guardian. If additional assistance is required, the guardian can forward the alert to the police assistance portal.

The project integrates hardware, software, and machine learning to provide a smart and responsive safety solution.

## 🎯 Objectives

- Provide real-time location tracking.
- Monitor heart-rate information for potential distress indicators.
- Detect possible voice-based distress situations using AI.
- Enable emergency alerts through a dedicated SOS button.
- Support safe-zone monitoring using geofencing.
- Help guardians coordinate with police assistance when required.

## ✨ Key Features

- **Real-Time GPS Tracking:** Tracks the wearer's location using a GPS module.
- **Emergency SOS Button:** Allows the wearer to request help manually.
- **Heart-Rate Monitoring:** Uses a MAX30102 sensor to monitor heart-rate readings.
- **AI-Based Voice Distress Detection:** Analyses voice-related input to identify possible distress situations.
- **Safe-Zone Monitoring:** Supports geofencing to identify when the wearer moves outside a defined safe zone.
- **Guardian Dashboard:** Provides access to location information, alerts, device status, and safety details.
- **Police Assistance Portal:** Supports viewing and managing emergency alerts forwarded by guardians.
- **Machine Learning:** Uses a Random Forest model for safety-related prediction.

## 🛠️ Technologies Used

### Software
- Frontend: React.js, HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB
- Machine Learning: Python, Scikit-learn
- API Communication: REST APIs
- Development Tools: Visual Studio Code, Git, GitHub

### Hardware
- ESP32 Microcontroller
- NEO-6M GPS Module
- MAX30102 Heart-Rate Sensor
- INMP441 Microphone
- Emergency SOS Button
- TP4056 Charging Module
- Rechargeable Li-ion Battery
- OLED Display and Control Switch

## 🏗️ Project Structure

```text
TRINETRA-AI/
├── Backend/          # Main application backend and APIs
├── Frontend/         # Guardian dashboard interface
├── Hardware/         # ESP32 and hardware integration code
├── Police_Portal/    # Police assistance portal
├── ml_model/         # Machine learning model and scripts
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB
- Python 3
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Tanshri-zade/TRINETRA-AI.git
cd TRINETRA-AI
```

### 2. Set Up the Main Backend

```bash
cd Backend
npm install
```

Configure the required environment variables using the project's configuration structure. Add your own database connection string and other required settings. Do not upload passwords, API keys, or environment files containing secrets to GitHub.

Start the backend using the script defined in `Backend/package.json`, for example:

```bash
npm start
```

### 3. Set Up the Frontend

Open a new terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL shown in the terminal.

### 4. Set Up the Police Portal

Open another terminal:

```bash
cd Police_Portal
npm install
```

Start the portal using the script defined in `Police_Portal/package.json`, for example:

```bash
npm run dev
```

### 5. Set Up the Machine Learning Model

Install the required Python dependencies according to the project's requirements and imports. Run the prediction script using the appropriate Python environment and model path.

```bash
python predict.py
```

Run commands from the relevant project directory. Database configuration, environment variables, frontend API URLs, and model dependencies must be configured before all modules can work together.

## 🔄 How It Works

1. The wearable device collects available sensor readings and GPS location data.
2. The system evaluates configured safety conditions and relevant model predictions.
3. A manual SOS request or detected distress condition can trigger an emergency alert.
4. The guardian receives the alert and can review the available location information.
5. If further assistance is needed, the guardian can forward the alert to the police assistance portal.

## 🌱 Future Scope

- Improve machine-learning accuracy using larger and more diverse datasets.
- Add further testing of automatic distress detection in real-world conditions.
- Improve battery efficiency and wearable-device design.
- Extend compatibility with mobile applications.
- Explore direct emergency-service integration, subject to permissions and applicable requirements.

## ⚠️ Project Status

**Current Status:** Prototype / Major Project

TRINETRA AI is being developed as a prototype. Its sensor readings, machine-learning predictions, location tracking, alert delivery, and hardware integration require appropriate testing before real-world deployment.

This project is intended to support personal safety and is not a replacement for official emergency services.

## 👥 Team

Developed as a collaborative academic major project by a team of five members.

**Project Name:** TRINETRA AI  
**Domain:** Artificial Intelligence, Machine Learning, IoT, and Women & Children Safety

## 📄 License

No license has been specified yet. Please add an appropriate license if you intend to distribute or reuse this project publicly.
