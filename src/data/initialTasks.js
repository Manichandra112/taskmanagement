export const initialTasks = [
  // A nested tree project: Software Company Formation
  {
    id: "task_nest_1",
    title: "New Software Company Formation - provided all info follow up for incorporation",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Harish",
    subtasks: [
      {
        id: "task_nest_1_sub1",
        title: "Apply for DSC (Digital Signature Certificate)",
        dueDate: "2026-07-14",
        status: "Complete",
        assignee: "Harish",
        subtasks: [
          {
            id: "task_nest_1_sub1_subsub1",
            title: "Collect PAN card and Aadhaar proof of directors",
            dueDate: "2026-07-14",
            status: "Complete",
            assignee: "Bennet",
            subtasks: []
          },
          {
            id: "task_nest_1_sub1_subsub2",
            title: "Obtain video verification confirmations",
            dueDate: "2026-07-14",
            status: "Complete",
            assignee: "Saravanan",
            subtasks: []
          }
        ]
      },
      {
        id: "task_nest_1_sub2",
        title: "File SPICe+ Part A for Name Approval",
        dueDate: "2026-07-14",
        status: "Pending",
        assignee: "Senthil advocate",
        subtasks: [
          {
            id: "task_nest_1_sub2_subsub1",
            title: "Finalize top 2 company name choices",
            dueDate: "2026-07-14",
            status: "Complete",
            assignee: "AAA - Today works",
            subtasks: []
          },
          {
            id: "task_nest_1_sub2_subsub2",
            title: "Check trademark registry compatibility",
            dueDate: "2026-07-14",
            status: "Pending",
            assignee: "Senthil advocate",
            subtasks: []
          }
        ]
      },
      {
        id: "task_nest_1_sub3",
        title: "Draft SPICe+ Part B & upload incorporation forms",
        dueDate: "2026-07-20",
        status: "Pending",
        assignee: "Harish",
        subtasks: []
      }
    ]
  },

  // Second nested tree project: Website Redesign (demonstrates sequential locks)
  {
    id: "task_project_a",
    title: "Website Redesign & Client Portal Project",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Gautham - Codepulse",
    subtasks: [
      {
        id: "task_project_a_sub1",
        title: "Design homepage & client dashboard mockups",
        dueDate: "2026-07-14",
        status: "Complete",
        assignee: "Bennet",
        subtasks: []
      },
      {
        id: "task_project_a_sub2",
        title: "Develop backend API endpoints",
        dueDate: "2026-07-14",
        status: "Pending",
        assignee: "Harish",
        subtasks: [
          {
            id: "task_project_a_sub2_sub1",
            title: "Configure Postgres database migrations",
            dueDate: "2026-07-14",
            status: "Complete",
            assignee: "Selva",
            subtasks: []
          },
          {
            id: "task_project_a_sub2_sub2",
            title: "Build User Authentication endpoints",
            dueDate: "2026-07-14",
            status: "Pending",
            assignee: "Robin",
            subtasks: []
          },
          {
            id: "task_project_a_sub2_sub3",
            title: "Perform API load testing and optimization",
            dueDate: "2026-07-14",
            status: "Pending",
            assignee: "Harish",
            subtasks: []
          }
        ]
      },
      {
        id: "task_project_a_sub3",
        title: "Integrate React Frontend & Redux State",
        dueDate: "2026-07-25",
        status: "Pending",
        assignee: "Gautham - Codepulse",
        subtasks: []
      }
    ]
  },

  // AAA - Today works
  {
    id: "task_1",
    title: "Trichy land agreement to Rajkumar",
    dueDate: "2026-04-07",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },
  {
    id: "task_2",
    title: "demt status mail - Rakesh Varma",
    dueDate: "2026-04-10",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },
  {
    id: "task_3",
    title: "Reply to vani message",
    dueDate: "2026-04-10",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },
  {
    id: "task_4",
    title: "Spoke to Gautham jha and confirm",
    dueDate: "2026-04-10",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },
  {
    id: "task_5",
    title: "Ask sundar sir about the commision to Preethi Mumbai",
    dueDate: "2026-04-11",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },
  {
    id: "task_6",
    title: "Draft Co-investment AGreement",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },
  {
    id: "task_7",
    title: "CISI membership fee payment",
    dueDate: "2026-07-03",
    status: "Complete",
    assignee: "AAA - Today works",
    subtasks: []
  },

  // Abirami
  {
    id: "task_8",
    title: "Asset page of Ventures",
    dueDate: "2026-04-02",
    status: "Complete",
    assignee: "Abirami",
    subtasks: []
  },
  {
    id: "task_9",
    title: "test",
    dueDate: "2026-04-08",
    status: "Complete",
    assignee: "Abirami",
    subtasks: []
  },

  // Bennet
  {
    id: "task_10",
    title: "Video Shoot",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Bennet",
    subtasks: []
  },

  // Channel Partner
  {
    id: "task_11",
    title: "Reema Kohli - Linked in Connect",
    dueDate: "2025-11-24",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_12",
    title: "Sarath Bangalore",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_13",
    title: "Ravichandran Madurai - not coming back",
    dueDate: "2026-04-08",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_14",
    title: "Gautham Jha - confirm his terms",
    dueDate: "2026-04-10",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_15",
    title: "Prasanth - Hyderabad",
    dueDate: "2026-04-30",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_16",
    title: "Lavanya - Dubai",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_17",
    title: "Sunil Narayanan - Bangalore",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_18",
    title: "Call anand kumar Tripathi - 8858478799",
    dueDate: "2026-06-05",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_19",
    title: "Sudhir Khasyap - Banglore",
    dueDate: "2026-06-05",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_20",
    title: "Bojarajan - not answering us",
    dueDate: "2026-06-30",
    status: "Complete",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_21",
    title: "Call Ayyappan and ask the status",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_22",
    title: "Dharsana - Jiten Shah",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Channel Partner",
    subtasks: []
  },
  {
    id: "task_23",
    title: "Shruthika - US Ramnath",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Channel Partner",
    subtasks: []
  },

  // Gautham - Codepulse
  {
    id: "task_24",
    title: "Increase Server space",
    dueDate: "2025-12-26",
    status: "Complete",
    assignee: "Gautham - Codepulse",
    subtasks: []
  },

  // Harish
  {
    id: "task_25",
    title: "GST for GHL India Tech LLP",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_26",
    title: "Demand Notice for Getrobiz LLP",
    dueDate: "2026-07-03",
    status: "Complete",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_27",
    title: "Demand Notice for Giotex AI",
    dueDate: "2026-07-03",
    status: "Complete",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_28",
    title: "Growrich EPC -Auditor resignation",
    dueDate: "2026-07-13",
    status: "Complete",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_29",
    title: "Unibull - Auditor resignation",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_30",
    title: "CTRLsoft - Auditor resignation",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_32",
    title: "Indo-westeren - Auditor resignation",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Harish",
    subtasks: []
  },
  {
    id: "task_33",
    title: "Sankar sir income tax case",
    dueDate: "2026-07-20",
    status: "Pending",
    assignee: "Harish",
    subtasks: []
  },

  // OPRL Vijay
  {
    id: "task_34",
    title: "Costing for OPRL products",
    dueDate: "2026-05-09",
    status: "Complete",
    assignee: "OPRL Vijay",
    subtasks: []
  },

  // Own
  {
    id: "task_35",
    title: "Draft Mortgage Agreement",
    dueDate: "2025-12-01",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_36",
    title: "Harish terms finalisation",
    dueDate: "2025-12-01",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_37",
    title: "RBI firms page registration for Landmaxo Properties",
    dueDate: "2025-12-15",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_38",
    title: "RBI firms registration for GHL Venture Management",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_39",
    title: "Review BTB agreement",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_40",
    title: "Payment to Canara Bank balance 1 crore for auction property",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_41",
    title: "Register with CISI. Mail sent, let me expect a reply soon",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_42",
    title: "Mail to Ambrish - after new term sheet",
    dueDate: "2025-12-20",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_43",
    title: "Venture Website name display in Google - go with 10 employees and make the video",
    dueDate: "2026-01-21",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_44",
    title: "Ask to collect Passport from Sivakumar",
    dueDate: "2026-01-23",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_45",
    title: "Srivilliputhur court hearing on 11-02-2026",
    dueDate: "2026-02-25",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },
  {
    id: "task_46",
    title: "Google my Business profile update",
    dueDate: "2026-05-02",
    status: "Complete",
    assignee: "Own",
    subtasks: []
  },

  // Pathu
  {
    id: "task_47",
    title: "AIF registration work",
    dueDate: "2025-11-24",
    status: "Complete",
    assignee: "Pathu",
    subtasks: []
  },

  // Personnel
  {
    id: "task_48",
    title: "Kites Registration",
    dueDate: "2026-05-12",
    status: "Complete",
    assignee: "Personnel",
    subtasks: []
  },

  // Raj
  {
    id: "task_49",
    title: "Ask for the recruitment of Accounts persons",
    dueDate: "2026-06-02",
    status: "Complete",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_50",
    title: "Karthi Subramaniam Appt letter",
    dueDate: "2026-06-04",
    status: "Complete",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_51",
    title: "Send RKM case paper sign to SIvakumar RKL -confirm from Arul sir",
    dueDate: "2026-06-23",
    status: "Complete",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_52",
    title: "Call Rajaveni -9585689277",
    dueDate: "2026-06-25",
    status: "Complete",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_53",
    title: "e-Bullion Corporate account opening",
    dueDate: "2026-06-30",
    status: "Complete",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_54",
    title: "Priya HDFC voice message and wahtsapp message given",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_55",
    title: "Suganthi writing exam",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_56",
    title: "Raja HDFC will meet 1.00 pm",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_57",
    title: "Rettaimanagalam approval email to be received",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_58",
    title: "CISI CPD programme",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Raj",
    subtasks: []
  },
  {
    id: "task_59",
    title: "Meeting with Einstien Durai",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Raj",
    subtasks: []
  },

  // Robin
  {
    id: "task_60",
    title: "Upload Blog content to website - Upload creative",
    dueDate: "2026-04-02",
    status: "Complete",
    assignee: "Robin",
    subtasks: []
  },

  // Sam
  {
    id: "task_61",
    title: "File Satisfaction of Charge to Asset VI",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_62",
    title: "submit KYC documents",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_63",
    title: "Presentation for Srilankan bank",
    dueDate: "2025-12-20",
    status: "Complete",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_64",
    title: "Demat account for GHL Venture MGT",
    dueDate: "2026-01-02",
    status: "Complete",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_65",
    title: "Legal opinion for Real estate",
    dueDate: "2026-04-02",
    status: "Complete",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_66",
    title: "Amend Object clause of Landmaxo",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_67",
    title: "ISIN creation for Jamin Properties",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_68",
    title: "DP account opening for Landmaxo",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_69",
    title: "Inspection of Rexnord Enterprises",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_70",
    title: "Landmaxo - Debenture allotment and form filing",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Sam",
    subtasks: []
  },
  {
    id: "task_71",
    title: "ISIN creation for Venture",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Sam",
    subtasks: []
  },

  // Saravanan
  {
    id: "task_72",
    title: "pi",
    dueDate: "2026-06-04",
    status: "Complete",
    assignee: "Saravanan",
    subtasks: []
  },
  {
    id: "task_73",
    title: "Change in Pending work sheet",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Saravanan",
    subtasks: []
  },
  {
    id: "task_74",
    title: "Landmaxo Web site changes",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Saravanan",
    subtasks: []
  },

  // Selva
  {
    id: "task_75",
    title: "Database movement",
    dueDate: "2025-12-17",
    status: "Complete",
    assignee: "Selva",
    subtasks: []
  },
  {
    id: "task_76",
    title: "SMTP",
    dueDate: "2026-01-22",
    status: "Complete",
    assignee: "Selva",
    subtasks: []
  },
  {
    id: "task_77",
    title: "Ask Money - Ask for investor reference",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Selva",
    subtasks: []
  },

  // Senthil advocate
  {
    id: "task_78",
    title: "Soniya Passport confirmation",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Senthil advocate",
    subtasks: []
  },
  {
    id: "task_79",
    title: "Andikan Cheque Case",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Senthil advocate",
    subtasks: []
  },
  {
    id: "task_80",
    title: "Growrich Real Estate -Audito Resingationm",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Senthil advocate",
    subtasks: []
  },

  // Shankar HCL
  {
    id: "task_81",
    title: "CCTV camera to Egmore ofice",
    dueDate: "2025-12-20",
    status: "Complete",
    assignee: "Shankar HCL",
    subtasks: []
  },
  {
    id: "task_82",
    title: "CCTV @ Egmore Office",
    dueDate: "2026-06-05",
    status: "Complete",
    assignee: "Shankar HCL",
    subtasks: []
  },
  {
    id: "task_83",
    title: "New network provision in Accounts room",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Shankar HCL",
    subtasks: []
  },
  {
    id: "task_84",
    title: "Chairman Room Mat change",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Shankar HCL",
    subtasks: []
  },
  {
    id: "task_85",
    title: "New cabin EB",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Shankar HCL",
    subtasks: []
  },

  // Shruthika
  {
    id: "task_86",
    title: "Appointment of Content Writer",
    dueDate: "2025-11-24",
    status: "Complete",
    assignee: "Shruthika",
    subtasks: []
  },
  {
    id: "task_87",
    title: "Content Writer",
    dueDate: "2025-11-24",
    status: "Complete",
    assignee: "Shruthika",
    subtasks: []
  },
  {
    id: "task_88",
    title: "Debenture Agreement to Mithul Client",
    dueDate: "2025-11-24",
    status: "Complete",
    assignee: "Shruthika",
    subtasks: []
  },
  {
    id: "task_89",
    title: "Recruitment for IRM",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Shruthika",
    subtasks: []
  },

  // Sivaraj
  {
    id: "task_90",
    title: "Buy Cloud storage from Google & upload Accounts and Tax-related file to that cloud",
    dueDate: "2026-01-23",
    status: "Complete",
    assignee: "Sivaraj",
    subtasks: []
  },
  {
    id: "task_91",
    title: "IDFC Fund Release",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "Sivaraj",
    subtasks: []
  },

  // SSS
  {
    id: "task_92",
    title: "MGC teja for invoice - Inform to Sundar Sir",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "SSS",
    subtasks: []
  },
  {
    id: "task_93",
    title: "Ask postal copy pic from Hari Krish",
    dueDate: "2026-05-30",
    status: "Complete",
    assignee: "SSS",
    subtasks: []
  },
  {
    id: "task_94",
    title: "ask for Income Tax decution amount purpose",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "SSS",
    subtasks: []
  },

  // Suganthi
  {
    id: "task_95",
    title: "Ask about Fund Manager exam",
    dueDate: "2026-07-14",
    status: "Pending",
    assignee: "Suganthi",
    subtasks: []
  }
];
