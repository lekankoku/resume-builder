
import { ResumeData } from './types';

export const resumeData: ResumeData = {
  personal: {
    name: "Lekan Koku",
    title: "Senior Fullstack Engineer",
    phone: "+4917687922820",
    email: "hello@lekankoku.com",
    residence: "Berlin, Germany",
    nationality: "German",
    website: "https://lekankoku.com",
    linkedin: "https://www.linkedin.com/in/lekankoku/",
    github: "https://github.com/lekankoku",
    photoUrl: "https://lekankoku.com/profile.jpg"
  },
  experiences: [
    {
      company: "Doodle Deutschland GmbH.",
      location: "Berlin, Germany",
      role: "Fullstack engineer",
      period: "December 2023 - January 2026",
      bullets: [
        "Owned checkout flow across frontend and backend in a microservice architecture serving around 2 million daily active users",
        "Led redesign and refactor of billing architecture handling roughly 1+ million events per day",
        "Designed and implemented Spring based billing services with PostgreSQL and Kafka",
        "Delivered data migrations, production rollout, monitoring, and incident handling for finance critical systems",
        "Acted as company level escalation point for billing incidents and data consistency issues",
        "Shipped around 30 growth experiments across React and backend services targeting conversion and monetization",
        "Doubled monthly conversions from around 40,000 to 80,000 through experiment driven changes",
        "Enabled discounts, coupons, promo codes, and multi plan pricing through new billing capabilities",
        "Reduced incidents and unblocked customer success and finance teams to build on the billing platform",
        "Improved latency and reliability by migrating key flows to Next.js server side rendering"
      ]
    },
    {
      company: "Notch GmbH.",
      location: "Hamburg, Germany",
      role: "Software Engineer",
      period: "June 2020 - October 2021",
      bullets: [
        "Served as technical lead with shared ownership for core product features in a modular monolith system",
        "Delivered end to end features including backend domain modeling, REST APIs, and frontend implementation",
        "Built Kotlin and Spring Boot services with SQL based relational schemas on AWS Aurora",
        "Implemented database migrations, CI workflows, and production rollouts",
        "Improved performance, reliability, and internal tooling as the product evolved",
        "Balanced delivery speed with maintainability under limited team size and changing requirements",
        "Collaborated closely with product managers, designers, engineers, and founders",
        "Authored technical design documents, ADRs, and internal documentation",
        "Demoed features regularly to internal stakeholders and pilot customers"
      ]
    },
    {
      company: "BXC Security",
      location: "Bavaria, Germany",
      role: "Software Engineer",
      period: "March 2021 - October 2022",
      bullets: [
        "Owned end to end MVP development for a cybersecurity risk analysis platform",
        "Designed system architecture for single tenant and hybrid cloud deployments",
        "Built React frontend and migrated legacy AngularJS code",
        "Implemented Node.js backend APIs and core business logic",
        "Designed PostgreSQL data models for regulated enterprise environments",
        "Implemented OIDC based authentication and authorization on AWS",
        "Worked directly with founders, security experts, and enterprise clients",
        "Delivered weekly demos, technical documentation, and architecture diagrams",
        "Supported evaluation by three large German enterprises"
      ]
    },
    {
      company: "JustWatch GmbH.",
      location: "Berlin, Germany",
      role: "Software Engineer, Fullstack",
      period: "May 2019 - December 2020",
      bullets: [
        "Built consumer facing features used by up to 20 million users at peak",
        "Shipped frontend A/B tests on discovery and recommendation surfaces",
        "Delivered experiments to full user population under legacy constraints",
        "Achieved retention and watch intent lifts up to 25 percent during COVID period",
        "Built and maintained Go based scraping pipelines for around 40 content providers",
        "Ensured near real time ingestion under unstable providers and missing APIs",
        "Contributed to React Native TV apps on Android TV, Apple TV, and Xbox",
        "Designed cross app TV deep linking through reverse engineering and platform research",
        "Presented architecture in internal engineering talks and documentation"
      ]
    }
  ],
  abilities: [
    {
      title: "Distributed Fullstack Systems",
      bullets: [
        "6+ years building and maintaining fullstack systems in microservice architectures",
        "Experience serving high traffic platforms (2M+ daily users)",
        "Deep expertise in revenue and finance critical environments"
      ]
    },
    {
      title: "Event Driven and Data Systems",
      bullets: [
        "4+ years designing event driven workflows with Kafka",
        "Expert in PostgreSQL consistency and relational modeling",
        "Handling high volume event processing and complex data migrations"
      ]
    },
    {
      title: "Platform and API Engineering",
      bullets: [
        "6+ years designing RESTful API contracts and platform standards",
        "Skilled in OIDC authentication and enterprise security identity integration",
        "Proven track record in cross team platform evolution and versioning"
      ]
    }
  ],
  education: [
    {
      institution: "BTU Cottbus",
      location: "Berlin, Germany",
      degree: "Computer Science(Bsc)",
      period: "January 2019 - March 2023"
    }
  ],
  projects: [
    {
      company: "Doodle Deutschland GmbH",
      title: "Billing Platform Redesign",
      scope: "Architecture, services, migrations, rollout, and reliability",
      bullets: [
        "Focus: Kafka based event workflows, PostgreSQL consistency, Spring microservices",
        "Outcome: Fewer incidents, faster feature delivery, new pricing and discount models"
      ]
    },
    {
      company: "Doodle Deutschland GmbH",
      title: "Checkout Conversion Experiments",
      scope: "Frontend and backend experimentation ownership",
      bullets: [
        "Focus: React, Next.js, backend validation logic",
        "Outcome: Monthly conversions increased from around 40,000 to 80,000"
      ]
    },
    {
      company: "BXC Security",
      title: "Enterprise Security MVP",
      scope: "End to end system ownership",
      bullets: [
        "Focus: OIDC authentication, single tenant architecture, Postgres modeling",
        "Outcome: Validated by three enterprise customers in regulated environments"
      ]
    }
  ],
  crossFunctional: {
    title: "Cross Functional Collaboration",
    bullets: [
      "6+ years working closely with product, sales, data, finance, and customer success teams.",
      "Translating business requirements into technical solutions and tradeoffs."
    ]
  },
  languages: [
    { name: "English", level: "native" },
    { name: "German", level: "C1" }
  ],
  technicalProficiency: [
    { category: "Languages", skills: "TypeScript, Java, Kotlin, Go, JavaScript" },
    { category: "Frontend", skills: "React, Next.js, Vue.js, React Native, Server Side Rendering" },
    { category: "Backend and APIs", skills: "Spring Boot, Node.js, REST API design" },
    { category: "Data and Eventing", skills: "PostgreSQL, MongoDB, Kafka, Debezium" },
    { category: "Architecture", skills: "Microservices, Modular Monoliths, Event Driven Design" },
    { category: "Cloud and Delivery", skills: "AWS, Kubernetes, GitHub Actions" },
    { category: "Security", skills: "OIDC authentication, enterprise identity integration, authorization logic" }
  ],
  references: [
    {
      name: "Philip Defner",
      role: "Head of Content Engineering",
      company: "Justwatch",
      linkedin: "https://linkedin.com"
    },
    {
      name: "Vladan Petrovic",
      role: "Senior Software Engineer",
      company: "Alphabet Inc.",
      linkedin: "https://linkedin.com"
    },
    {
      name: "Damiano Stoffe",
      role: "Technical Lead",
      company: "Gecal Informatica Srl",
      linkedin: "https://linkedin.com"
    }
  ]
};
