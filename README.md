# 🏆 Challenge Tracker

<a name="readme-top"></a>

<div align="center">

<!-- Add project screenshots here -->

</div>

<!-- TABLE OF CONTENTS -->

# 📗 Table of Contents

- [📖 About the Project](#about-project)
  - [🛠 Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
- [💻 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Run Tests](#run-tests)
  - [Deployment](#deployment)
- [👥 Authors](#authors)
- [🔭 Future Features](#future-features)
- [🤝 Contributing](#contributing)
- [⭐️ Show Your Support](#support)
- [🙏 Acknowledgements](#acknowledgements)
- [❓ FAQ](#faq)
- [📝 License](#license)

<!-- PROJECT DESCRIPTION -->

# 📖 Challenge Tracker <a name="about-project"></a>

> **Challenge Tracker** is a collaborative challenge and habit-tracking application designed to help people build consistency, stay accountable, and achieve their personal goals together.
>
> Users can create challenges, define daily tasks, invite participants, track their progress through daily check-ins, and visualize their achievements using an interactive progress calendar.

## 🛠 Built With <a name="built-with"></a>

### Tech Stack <a name="tech-stack"></a>

<details>
  <summary>Client & Server</summary>
  <ul>
    <li><a href="https://nextjs.org/">Next.js</a> (App Router)</li>
    <li><a href="https://react.dev/">React</a></li>
    <li><a href="https://www.typescriptlang.org/">TypeScript</a></li>
    <li><a href="https://tailwindcss.com/">Tailwind CSS</a></li>
  </ul>
</details>

<details>
  <summary>Database & ORM</summary>
  <ul>
    <li><a href="https://www.postgresql.org/">PostgreSQL</a></li>
    <li><a href="https://orm.drizzle.team/">Drizzle ORM</a></li>
    <li><a href="https://neon.tech/">Neon</a> for serverless PostgreSQL hosting</li>
  </ul>
</details>

<details>
  <summary>Authentication & Validation</summary>
  <ul>
    <li><a href="https://www.better-auth.com/">Better Auth</a> for authentication and session management</li>
    <li><a href="https://zod.dev/">Zod</a> for validation</li>
  </ul>
</details>

<details>
  <summary>Other Tools</summary>
  <ul>
    <li><a href="https://lucide.dev/">Lucide React</a> for icons</li>
    <li><a href="https://vercel.com/">Vercel</a> for deployment</li>
    <li><a href="https://git-scm.com/">Git</a> for version control</li>
    <li><a href="https://github.com/">GitHub</a> for source code hosting</li>
  </ul>
</details>

### Key Features <a name="key-features"></a>

> The main features of the application include:

- **Challenge creation** with titles, descriptions, start dates, end dates, and custom daily tasks.
- **Public and private challenges** to control challenge visibility and participation.
- **Challenge discovery** to explore and join available public challenges.
- **Participant invitations** to invite other users to private challenges.
- **Invitation management** to accept or decline challenge invitations.
- **Notifications** to keep users informed about pending invitations.
- **Daily task check-ins** to track completed tasks throughout a challenge.
- **Progress tracking** with daily completion percentages.
- **Interactive challenge calendar** to visualize the progress of participants.
- **Participant progress comparison** to see how everyone is progressing.
- **Personal dashboard** to manage challenges and invitations.
- **Responsive design** optimized for desktop and mobile devices.
- **Authentication and authorization** to manage user accounts and access to challenges.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## 💻 Getting Started <a name="getting-started"></a>

> To get a local copy up and running, follow these steps.

### Prerequisites

In order to run this project, you need:

- [Node.js](https://nodejs.org/) (v20 or later recommended)
- npm
- [PostgreSQL](https://www.postgresql.org/) database (local or hosted)
- A [Neon](https://neon.tech/) database account (optional if using local PostgreSQL)
- Git

### Setup

Clone this repository to your desired folder:

```sh
git clone git@github.com:YOUR_USERNAME/challenge-tracker.git
cd challenge-tracker
```

Install dependencies:

```sh
npm install
```

Create a `.env` file in the project root and configure your environment variables:

```env
DATABASE_URL=your_postgres_connection_string

BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

> Make sure your environment variable names match the configuration used in your project.

Push your database schema:

```sh
npx drizzle-kit push
```

### Usage

To run the project in development mode, execute:

```sh
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

You can then:

1. Create an account or sign in.
2. Create a challenge with a title, description, dates, and daily tasks.
3. Choose whether the challenge is public or private.
4. Join public challenges or accept invitations to private challenges.
5. Complete daily tasks and submit check-ins.
6. Track your progress using the challenge calendar.

### Run Tests

Automated tests are not yet implemented.

### Deployment

You can deploy this project using [Vercel](https://vercel.com/).

1. Create a PostgreSQL database using [Neon](https://neon.tech/) or another PostgreSQL provider.
2. Connect your GitHub repository to Vercel.
3. Configure the required environment variables in your Vercel project settings.
4. Set your production database connection string.
5. Deploy your application.
6. Apply your database schema using Drizzle Kit if necessary.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- AUTHORS -->

## 👥 Authors <a name="authors"></a>

👤 **Nessrine Macherki**

- GitHub: [@Nessrine88](https://github.com/Nessrine88)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/nessrine-macherki/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FUTURE FEATURES -->

## 🔭 Future Features <a name="future-features"></a>

> Planned future features include:

- Challenge streak tracking.
- Achievement badges and rewards.
- Leaderboards and rankings.
- Advanced progress statistics and analytics.
- Push notifications and reminders.
- Challenge templates.
- Improved invitation and notification systems.
- Automated testing.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## 🤝 Contributing <a name="contributing"></a>

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](https://github.com/YOUR_USERNAME/challenge-tracker/issues).

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes.
4. Commit your changes.
5. Submit a pull request.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- SUPPORT -->

## ⭐️ Show Your Support <a name="support"></a>

> If you find this project helpful or like the idea, consider giving it a star ⭐️.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGEMENTS -->

## 🙏 Acknowledgements <a name="acknowledgements"></a>

> Special thanks to the open-source communities behind Next.js, React, Drizzle ORM, Better Auth, Tailwind CSS, and PostgreSQL for providing the tools and resources that made this project possible.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FAQ -->

## ❓ FAQ <a name="faq"></a>

> **Do I need an account to use Challenge Tracker?**
>
> Yes, you need an account to create challenges, participate in challenges, and track your progress.

> **Can I create private challenges?**
>
> Yes. Private challenges are accessible to their creators and invited participants who accept the invitation.

> **Can I participate in public challenges created by other users?**
>
> Yes. You can discover public challenges and join them.

> **How is my progress calculated?**
>
> Your daily progress is calculated based on the number of scheduled tasks you complete for that day.

> **Can I invite other people to a private challenge?**
>
> Yes. Challenge creators can invite other users, who can accept or decline their invitations.

> **Can I track other participants' progress?**
>
> Yes. The challenge calendar provides a visual overview of participants' daily completion percentages.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## 📝 License <a name="license"></a>

This project is currently available under a license to be determined.

<p align="right">(<a href="#readme-top">back to top</a>)</p>