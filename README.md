# 🧠 MindMetrics

**A calm, front-end web app that helps first-year engineering students manage academic stress and build healthy study habits.**

Built as a Web Development mini-project at Bennett University (front-end only, no backend).

🔗 **Live demo:** _add your link here (for example https://your-username.github.io/mindmetrics/)_

---

## 📖 About

The first year of college brings new subjects, deadlines and a new way of living. MindMetrics gives students a simple place to check in with themselves, focus better and notice stress early, before it turns into burnout.

## ✨ Features

| Page | What it does |
|------|--------------|
| **Login / Sign up** | Create an account and log in. Each user's data is kept separate. |
| **Dashboard** | Weekly and monthly stress score tabs with bar charts, stat tiles, and comparison tables for the last 5 weeks and last 3 months. |
| **Deadlines** | Add, tick off and remove deadlines, with "due in X days" and overdue warnings. |
| **Wellness tips** | 500 original tips across 10 themes. A different tip shows on every visit. |
| **Focus Timer** | Pomodoro-style timer with 25 min, 50 min, 1 hr 30 min and custom lengths, plus short and long breaks. |
| **Daily Check-In** | Mood plus quantitative sliders (stress, energy, workload, sleep, study hours, exercise) that produce a 0–100 stress score, a breakdown and tailored advice. |

## 📊 How the stress score works

The score runs from **0 (very relaxed)** to **100 (very stressed)**:

- Stress level: up to 30 points
- Mood: up to 20 points
- Sleep (less than 8 hours adds points): up to 20 points
- Workload: up to 15 points
- Energy (lower energy adds points): up to 15 points
- Exercise: minus up to 5 points

**Levels:** Low (0–33), Moderate (34–66), High (67–100).

## 🛠️ Built with

- HTML5
- CSS3 (Flexbox, Grid, CSS variables, responsive design)
- Vanilla JavaScript (no frameworks)
- `localStorage` for saving data in the browser
- Google Fonts: Lora, Nunito and Poppins

## 📁 Project structure

```
mindmetrics/
├── index.html      # Dashboard (weekly / monthly stress, deadlines, tips)
├── login.html      # Login and sign up
├── timer.html      # Focus timer
├── checkin.html    # Daily check-in and stress score
├── style.css       # Global styles and theme
├── script.js       # All app logic
└── tips.js         # 500 wellness tips
```

## 🚀 Run it locally

1. Download or clone this repository.
2. Open the folder in VS Code.
3. Right-click `login.html` and choose **Open with Live Server** (or just double-click `login.html`).
4. Sign up and explore. Use **Load sample data** on the dashboard to see the charts filled in.

## ⚠️ Important notes

- **Demo login only.** Accounts and data are stored in each user's own browser (`localStorage`). This is not real security, so please don't use a real password. A production version would need a backend and database.
- **Data is per device.** Logging in on a different browser or device will not find the same account.
- **Tips are original.** The wellness tips are written in our own words, based on widely known ideas such as sleep hygiene, the Pomodoro technique, habit-building, mindfulness, Stoic thinking and growth mindset. They are not direct quotes from any book or account.
- **Not medical advice.** MindMetrics is a student project for self-awareness. If you are struggling, please talk to your campus counsellor or a trusted person.

## 🔮 Future improvements

- Backend and database for real accounts and shared data
- Charts with a library such as Chart.js
- Reminders and notifications
- Exportable weekly reports
- Dark mode

## 👥 Team

Team MindMetrics, Bennett University

- _Add team member names here_

## 📄 License

This project was created for educational purposes.
