// ==========================================
// 🚀 MEDI-CORE MASTER SYSTEM ENGINE
// Industry-Grade Simulation Logic
// ==========================================

// --- MOCK DATABASE ---
const MOCK_DB = {
    patients: [
        { id: "P-1001", name: "Amitabh Bachchan", age: 82, gender: "Male", phone: "9876543201", history: ["Hypertension", "Liver Cirrhosis (Managed)", "Asthma"], lastVisit: "2024-02-10", allergies: ["Penicillin"] },
        { id: "P-1002", name: "Deepika P.", age: 38, gender: "Female", phone: "9876543202", history: ["Anxiety", "Migraine"], lastVisit: "2024-01-25", allergies: ["None"] },
        { id: "P-1003", name: "Ranbir K.", age: 41, gender: "Male", phone: "9876543203", history: ["None"], lastVisit: "2023-11-12", allergies: ["Dust"] },
        { id: "P-1004", name: "Priyanka C.", age: 41, gender: "Female", phone: "9876543204", history: ["Asthma"], lastVisit: "2024-02-01", allergies: ["Pollen"] },
        { id: "P-1005", name: "Shahrukh K.", age: 58, gender: "Male", phone: "9876543205", history: ["Knee Surgery (2018)", "Back Pain"], lastVisit: "2024-01-15", allergies: ["Sulfa Drugs"] },
        { id: "P-1006", name: "Alia B.", age: 30, gender: "Female", phone: "9876543206", history: ["Pregnancy (Trimester 2)"], lastVisit: "2024-02-18", allergies: ["None"] },
        { id: "P-1007", name: "Salman K.", age: 58, gender: "Male", phone: "9876543207", history: ["Trigeminal Neuralgia"], lastVisit: "2023-12-05", allergies: ["None"] },
        { id: "P-1008", name: "Kareena K.", age: 43, gender: "Female", phone: "9876543208", history: ["Thyroid"], lastVisit: "2024-01-30", allergies: ["Peanuts"] },
        { id: "P-1009", name: "Akshay K.", age: 56, gender: "Male", phone: "9876543209", history: ["None - Athletic"], lastVisit: "2024-02-14", allergies: ["None"] },
        { id: "P-1010", name: "Katrina K.", age: 40, gender: "Female", phone: "9876543210", history: ["Low BP"], lastVisit: "2024-02-10", allergies: ["None"] },
        { id: "P-1011", name: "Hrithik R.", age: 50, gender: "Male", phone: "9876543211", history: ["Scoliosis (Mild)"], lastVisit: "2023-10-20", allergies: ["Shellfish"] },
        { id: "P-1012", name: "Aishwarya R.", age: 50, gender: "Female", phone: "9876543212", history: ["Migraine"], lastVisit: "2024-01-05", allergies: ["None"] },
        { id: "P-1013", name: "Ajay D.", age: 54, gender: "Male", phone: "9876543213", history: ["Smoker's Cough"], lastVisit: "2024-02-12", allergies: ["Smoke"] },
        { id: "P-1014", name: "Kajol D.", age: 49, gender: "Female", phone: "9876543214", history: ["Calcium Deficiency"], lastVisit: "2024-01-22", allergies: ["Lactose"] },
        { id: "P-1015", name: "Aamir K.", age: 58, gender: "Male", phone: "9876543215", history: ["Insomnia"], lastVisit: "2024-02-08", allergies: ["None"] }
    ],
    // Initial Queue State for Demo
    queue: [
        { token: 101, patientId: "P-1005", name: "Shahrukh K.", age: 58, gender: "Male", complaint: "Persistent Back Pain", type: "Regular", status: "Checked In", time: "09:00 AM", appointmentId: "APT-2024-001" },
        { token: 102, patientId: "P-1006", name: "Alia B.", age: 30, gender: "Female", complaint: "Routine Ante-natal Checkup", type: "Regular", status: "Waiting", time: "09:15 AM", appointmentId: "APT-2024-002" },
        { token: 103, patientId: "P-1001", name: "Amitabh Bachchan", age: 82, gender: "Male", complaint: "Breathlessness & Fatigue", type: "Emergency", status: "Waiting", time: "09:20 AM", appointmentId: "APT-EMG-001" },
        { token: 104, patientId: "P-1002", name: "Deepika P.", age: 38, gender: "Female", complaint: "Severe Migraine Aura", type: "Regular", status: "Waiting", time: "09:30 AM", appointmentId: "APT-2024-003" },
        { token: 105, patientId: "P-1011", name: "Hrithik R.", age: 50, gender: "Male", complaint: "Muscle Spasm", type: "Regular", status: "Waiting", time: "09:45 AM", appointmentId: "APT-2024-004" }
    ],
    // Mock Appointments for "Today's Schedule"
    appointments: [
        { id: "APT-2024-001", patientId: "P-1005", time: "09:00 AM", status: "Checked In", type: "Follow-up" },
        { id: "APT-2024-002", patientId: "P-1006", time: "09:15 AM", status: "Waiting", type: "Routine" },
        { id: "APT-2024-003", patientId: "P-1002", time: "09:30 AM", status: "Waiting", type: "New Complaint" },
        { id: "APT-2024-004", patientId: "P-1011", time: "09:45 AM", status: "Waiting", type: "Consultation" },
        { id: "APT-2024-005", patientId: "P-1008", time: "10:00 AM", status: "Scheduled", type: "Review" },
        { id: "APT-2024-006", patientId: "P-1004", time: "10:15 AM", status: "Scheduled", type: "Routine" },
        { id: "APT-2024-007", patientId: "P-1015", time: "10:30 AM", status: "Scheduled", type: "Therapy" },
        { id: "APT-2024-008", patientId: "P-1013", time: "10:45 AM", status: "Scheduled", type: "Consultation" },
        { id: "APT-2024-009", patientId: "P-1009", time: "11:00 AM", status: "Scheduled", type: "Fitness Cert" },
        { id: "APT-2024-010", patientId: "P-1010", time: "11:15 AM", status: "Scheduled", type: "General" }
    ],
    // Pre-filled Alerts
    notifications: [
        { id: 1, type: "info", msg: "Dr. Sharma (Neurology) is on leave today.", time: new Date().toISOString(), read: false },
        { id: 2, type: "warning", msg: "Server maintenance scheduled for 10 PM tonight.", time: new Date(Date.now() - 3600000).toISOString(), read: false },
        { id: 3, type: "success", msg: "Lab Report for P-1003 is ready for review.", time: new Date(Date.now() - 7200000).toISOString(), read: true }
    ]
};

// --- SYSTEM CONTROLLER ---
const System = {
    // Configuration
    defaults: {
        avgConsultTime: 15, // mins
        doctorName: "Dr. Rashmi",
        theme: "light"
    },

    init: function () {
        console.log("🚀 MediCore System Initializing...");

        // Initialize LocalStorage if empty
        // Start with a clean slate for the demo to ensure new data is loaded
        // Check a version flag or just overwrite if it looks like the old default
        const currentQ = JSON.parse(localStorage.getItem('doc_queue'));
        if (!currentQ || currentQ.length < 5) {
            this.setQueue(MOCK_DB.queue);
        }

        if (!localStorage.getItem('doc_patients') || JSON.parse(localStorage.getItem('doc_patients')).length < 5) {
            localStorage.setItem('doc_patients', JSON.stringify(MOCK_DB.patients));
        }

        if (!localStorage.getItem('doc_appointments')) {
            localStorage.setItem('doc_appointments', JSON.stringify(MOCK_DB.appointments));
        }

        if (!localStorage.getItem('doc_history') || JSON.parse(localStorage.getItem('doc_history')).length === 0) {
            const seedHistory = [
                { id: 901, patientId: "P-1003", name: "Ranbir K.", date: "12/11/2023", diagnosis: "Viral Flu", medicines: [{ name: "Paracetamol", dose: "1-0-1" }], notes: "Rest advised", type: "Regular" },
                { id: 902, patientId: "P-1007", name: "Salman K.", date: "05/12/2023", diagnosis: "Neuralgia", medicines: [{ name: "Gabapentin", dose: "0-0-1" }], notes: "Review after 2 weeks", type: "Regular" }
            ];
            localStorage.setItem('doc_history', JSON.stringify(seedHistory));
        }

        if (!localStorage.getItem('doc_audit')) localStorage.setItem('doc_audit', JSON.stringify([]));
        if (!localStorage.getItem('doc_notifications')) localStorage.setItem('doc_notifications', JSON.stringify(MOCK_DB.notifications));

        // Start Background Tasks
        setInterval(this.Tasks.simulateRealTime, 1000);
        setInterval(this.Tasks.simulateRandomEvents, 45000); // 45s random events
    },

    // --- DATA ACCESS ---
    getQueue: () => JSON.parse(localStorage.getItem('doc_queue')) || [],
    setQueue: (data) => localStorage.setItem('doc_queue', JSON.stringify(data)),

    getPatients: () => JSON.parse(localStorage.getItem('doc_patients')) || [],

    getAppointments: () => JSON.parse(localStorage.getItem('doc_appointments')) || [],
    setAppointments: (data) => localStorage.setItem('doc_appointments', JSON.stringify(data)),

    getCurrentPatient: () => JSON.parse(localStorage.getItem('doc_current_patient')),
    setCurrentPatient: (p) => localStorage.setItem('doc_current_patient', JSON.stringify(p)),

    getHistory: () => JSON.parse(localStorage.getItem('doc_history')) || [],

    // --- CORE WORKFLOW ACTIONS ---

    // 1. Call Next Patient
    callNext: function () {
        let queue = this.getQueue();

        // Logic: Emergency > Waiting > Checked In
        queue.sort((a, b) => {
            if (a.type === 'Emergency' && b.type !== 'Emergency') return -1;
            if (a.type !== 'Emergency' && b.type === 'Emergency') return 1;
            return 0;
        });

        const nextIdx = queue.findIndex(p => p.status === 'Waiting' || p.status === 'Checked In');

        if (nextIdx !== -1) {
            // Auto-complete previous if exists
            queue.forEach(p => { if (p.status === 'Consulting') p.status = 'Completed'; });

            const nextP = queue[nextIdx];
            nextP.status = 'Consulting';
            nextP.startTime = new Date().toISOString(); // Start Timer

            queue[nextIdx] = nextP;
            this.setQueue(queue);
            this.setCurrentPatient(nextP);

            this.log('OP_CALL', `Called Patient: ${nextP.name} (Token ${nextP.token})`);
            return nextP;
        }
        return null;
    },

    // 1.5 Skip Patient
    skipPatient: function () {
        let queue = this.getQueue();
        const current = this.getCurrentPatient();

        if (current) {
            // Find current in queue
            const idx = queue.findIndex(p => p.token === current.token);
            if (idx !== -1) {
                // Move to end of waiting list
                let p = queue[idx];
                p.status = 'Waiting'; // Reset to waiting
                p.notes = (p.notes || "") + " [Skipped]";

                // Remove from current pos
                queue.splice(idx, 1);
                // Push to end
                queue.push(p);

                this.setQueue(queue);
                this.log('OP_SKIP', `Skipped Patient: ${current.name}`);
                this.setCurrentPatient(null);

                // Reload dashboard
                window.location.reload();
            }
        } else {
            alert("No active patient to skip.");
        }
    },

    // 2. Complete Consultation
    completeConsultation: function (prescriptionData) {
        const current = this.getCurrentPatient();
        if (!current) return;

        // Save to History
        let history = this.getHistory();
        const record = {
            id: Date.now(),
            patientId: current.patientId,
            name: current.name,
            date: new Date().toLocaleDateString(),
            diagnosis: prescriptionData.diagnosis,
            medicines: prescriptionData.medicines,
            notes: prescriptionData.notes,
            type: current.type
        };
        history.unshift(record);
        localStorage.setItem('doc_history', JSON.stringify(history));

        // Update Queue Status
        let queue = this.getQueue();
        const idx = queue.findIndex(p => p.token === current.token);
        if (idx !== -1) {
            queue[idx].status = 'Completed';
            queue[idx].endTime = new Date().toISOString();
            this.setQueue(queue);
        }

        // Clear Current
        this.setCurrentPatient(null);
        this.log('OP_COMPLETE', `Completed consultation for ${current.name}`);
        this.notify('Success', `Prescription saved for ${current.name}`);
    },

    // --- INTELLIGENCE ENGINES ---

    // 🧠 AI Symptom Checker
    AI: {
        analyze: function (symptom) {
            symptom = symptom.toLowerCase();
            if (symptom.includes('fever') || symptom.includes('viral'))
                return { diagnosis: 'Viral Infection', tests: ['CBC', 'Dengue NS1'], meds: ['Paracetamol 650mg', 'Vitamin C'] };
            if (symptom.includes('chest') || symptom.includes('heart'))
                return { diagnosis: 'Angina / Cardiac Issue', tests: ['ECG', 'Troponin-I', 'Lipid Profile'], meds: ['Aspirin 75mg', 'Sorbitrate'] };
            if (symptom.includes('skin') || symptom.includes('itch'))
                return { diagnosis: 'Allergic Dermatitis', tests: ['IgE'], meds: ['Cetirizine 10mg', 'Calamine Lotion'] };
            if (symptom.includes('headache') || symptom.includes('migraine'))
                return { diagnosis: 'Migraine', tests: ['Eye Checkup'], meds: ['Naproxen 500mg', 'Domperidone'] };

            return { diagnosis: 'General Observation', tests: ['Vitals Check'], meds: ['Multivitamins'] };
        }
    },

    // 📊 Risk Engine
    Risk: {
        evaluate: function (patient) {
            let risk = { level: 'Low', color: 'success', factors: [] };

            // Age Factor
            if (patient.age > 60) {
                risk.factors.push('Senior Citizen');
                risk.level = 'Moderate';
                risk.color = 'warning';
            }

            // Keyword History Factor
            const critical = ['cardiac', 'heart', 'stroke', 'diabetes', 'cancer'];
            // Check mock DB for full history if available, else usage local object
            const fullProfile = System.getPatients().find(p => p.id === patient.patientId);
            const historyStr = fullProfile ? (fullProfile.history ? fullProfile.history.join(', ').toLowerCase() : "") : (patient.history || "").toLowerCase();

            if (critical.some(c => historyStr.includes(c)) || patient.type === 'Emergency') {
                risk.level = 'High';
                risk.color = 'danger';
                risk.factors.push('Critical History/Emergency');
            }

            return risk;
        }
    },

    // 🏥 Clinical Decision Support System (CDSS)
    CDSS: {
        // Drug-Drug Interaction Database
        drugInteractions: {
            'Aspirin': ['Warfarin', 'Clopidogrel', 'Heparin'],
            'Warfarin': ['Aspirin', 'Ibuprofen', 'Naproxen'],
            'Metformin': ['Alcohol', 'Contrast Dye'],
            'Penicillin': ['Amoxicillin', 'Ampicillin'],
            'Amoxicillin': ['Penicillin', 'Ampicillin'],
            'Ibuprofen': ['Warfarin', 'Aspirin', 'Prednisone'],
            'Prednisone': ['Ibuprofen', 'Aspirin'],
            'Insulin': ['Metformin', 'Glipizide'],
            'ACE Inhibitors': ['Potassium', 'Spironolactone'],
            'Digoxin': ['Amiodarone', 'Verapamil']
        },

        // Check for drug-drug interactions
        checkDrugInteractions: function (medicines) {
            const warnings = [];
            const medicineNames = medicines.map(m => m.name.trim());

            for (let i = 0; i < medicineNames.length; i++) {
                for (let j = i + 1; j < medicineNames.length; j++) {
                    const med1 = medicineNames[i];
                    const med2 = medicineNames[j];

                    // Check if med1 interacts with med2
                    Object.keys(this.drugInteractions).forEach(drug => {
                        if (med1.toLowerCase().includes(drug.toLowerCase())) {
                            this.drugInteractions[drug].forEach(interacting => {
                                if (med2.toLowerCase().includes(interacting.toLowerCase())) {
                                    warnings.push({
                                        type: 'drug-interaction',
                                        severity: 'high',
                                        message: `⚠️ Drug Interaction: ${med1} may interact with ${med2}`,
                                        drugs: [med1, med2]
                                    });
                                }
                            });
                        }
                    });
                }
            }

            return warnings;
        },

        // Check for allergy conflicts
        checkAllergies: function (patientAllergies, medicines) {
            const warnings = [];

            if (!patientAllergies || patientAllergies.length === 0 || patientAllergies[0] === 'None') {
                return warnings;
            }

            medicines.forEach(med => {
                patientAllergies.forEach(allergy => {
                    if (allergy.toLowerCase() !== 'none' &&
                        med.name.toLowerCase().includes(allergy.toLowerCase())) {
                        warnings.push({
                            type: 'allergy',
                            severity: 'critical',
                            message: `🚨 ALLERGY ALERT: Patient is allergic to ${allergy}`,
                            medicine: med.name,
                            allergy: allergy
                        });
                    }

                    // Check for drug family allergies
                    if (allergy.toLowerCase() === 'penicillin') {
                        const penicillinFamily = ['amoxicillin', 'ampicillin', 'penicillin'];
                        if (penicillinFamily.some(p => med.name.toLowerCase().includes(p))) {
                            warnings.push({
                                type: 'allergy',
                                severity: 'critical',
                                message: `🚨 ALLERGY ALERT: ${med.name} is in Penicillin family`,
                                medicine: med.name,
                                allergy: 'Penicillin Family'
                            });
                        }
                    }

                    if (allergy.toLowerCase() === 'sulfa' || allergy.toLowerCase().includes('sulfa')) {
                        const sulfaFamily = ['sulfamethoxazole', 'trimethoprim', 'sulfa'];
                        if (sulfaFamily.some(s => med.name.toLowerCase().includes(s))) {
                            warnings.push({
                                type: 'allergy',
                                severity: 'critical',
                                message: `🚨 ALLERGY ALERT: ${med.name} contains Sulfa compounds`,
                                medicine: med.name,
                                allergy: 'Sulfa Drugs'
                            });
                        }
                    }
                });
            });

            return warnings;
        },

        // Analyze vital signs and provide warnings
        analyzeVitals: function (vitals) {
            const warnings = [];

            if (!vitals) return warnings;

            // Blood Pressure Analysis
            if (vitals.bpSystolic) {
                if (vitals.bpSystolic > 140 || vitals.bpDiastolic > 90) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'high',
                        message: `⚠️ Hypertension Risk: BP ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg (Normal: <120/<80)`,
                        category: 'Blood Pressure'
                    });
                } else if (vitals.bpSystolic < 90 || vitals.bpDiastolic < 60) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'medium',
                        message: `⚠️ Hypotension: BP ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg`,
                        category: 'Blood Pressure'
                    });
                }
            }

            // Blood Sugar Analysis
            if (vitals.bloodSugar) {
                if (vitals.bloodSugar > 200) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'high',
                        message: `⚠️ High Blood Sugar: ${vitals.bloodSugar} mg/dL (Normal: 70-140)`,
                        category: 'Blood Sugar'
                    });
                } else if (vitals.bloodSugar < 70) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'high',
                        message: `⚠️ Hypoglycemia: ${vitals.bloodSugar} mg/dL - Risk of Low Sugar`,
                        category: 'Blood Sugar'
                    });
                }
            }

            // Heart Rate Analysis
            if (vitals.heartRate) {
                if (vitals.heartRate > 100) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'medium',
                        message: `⚠️ Tachycardia: Heart Rate ${vitals.heartRate} bpm (Normal: 60-100)`,
                        category: 'Heart Rate'
                    });
                } else if (vitals.heartRate < 60) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'medium',
                        message: `⚠️ Bradycardia: Heart Rate ${vitals.heartRate} bpm`,
                        category: 'Heart Rate'
                    });
                }
            }

            // Oxygen Saturation Analysis
            if (vitals.oxygenSat) {
                if (vitals.oxygenSat < 95) {
                    warnings.push({
                        type: 'vitals',
                        severity: vitals.oxygenSat < 90 ? 'critical' : 'high',
                        message: `⚠️ Low Oxygen Saturation: ${vitals.oxygenSat}% (Normal: >95%)`,
                        category: 'Oxygen'
                    });
                }
            }

            // Temperature Analysis
            if (vitals.temperature) {
                if (vitals.temperature > 99.5) {
                    warnings.push({
                        type: 'vitals',
                        severity: vitals.temperature > 101 ? 'high' : 'medium',
                        message: `⚠️ Fever Detected: ${vitals.temperature}°F (Normal: 97-99°F)`,
                        category: 'Temperature'
                    });
                } else if (vitals.temperature < 97) {
                    warnings.push({
                        type: 'vitals',
                        severity: 'medium',
                        message: `⚠️ Hypothermia: ${vitals.temperature}°F`,
                        category: 'Temperature'
                    });
                }
            }

            return warnings;
        },

        // Calculate comprehensive risk level
        calculateRiskLevel: function (patient, vitals, medicines) {
            let riskScore = 0;
            const factors = [];

            // Age risk
            if (patient.age > 70) {
                riskScore += 3;
                factors.push('Advanced Age (>70)');
            } else if (patient.age > 60) {
                riskScore += 2;
                factors.push('Senior Citizen');
            }

            // Medical history risk
            const fullProfile = System.getPatients().find(p => p.id === patient.patientId);
            const historyStr = fullProfile ? (fullProfile.history ? fullProfile.history.join(', ').toLowerCase() : "") : "";

            const criticalConditions = ['cardiac', 'heart', 'stroke', 'diabetes', 'cancer', 'kidney', 'liver'];
            criticalConditions.forEach(condition => {
                if (historyStr.includes(condition)) {
                    riskScore += 2;
                    factors.push(`History: ${condition}`);
                }
            });

            // Vital signs risk
            if (vitals) {
                if (vitals.bpSystolic > 140) {
                    riskScore += 2;
                    factors.push('Hypertension');
                }
                if (vitals.bloodSugar > 200) {
                    riskScore += 2;
                    factors.push('Hyperglycemia');
                }
                if (vitals.oxygenSat < 95) {
                    riskScore += 3;
                    factors.push('Low O2 Saturation');
                }
            }

            // Emergency type
            if (patient.type === 'Emergency') {
                riskScore += 3;
                factors.push('Emergency Case');
            }

            // Multiple medications risk
            if (medicines && medicines.length > 5) {
                riskScore += 1;
                factors.push('Polypharmacy (>5 drugs)');
            }

            // Determine risk level
            let level, color, badge;
            if (riskScore >= 8) {
                level = 'High';
                color = 'danger';
                badge = '🔴';
            } else if (riskScore >= 4) {
                level = 'Medium';
                color = 'warning';
                badge = '🟡';
            } else {
                level = 'Low';
                color = 'success';
                badge = '🟢';
            }

            return {
                level: level,
                color: color,
                badge: badge,
                score: riskScore,
                factors: factors
            };
        },

        // Master function to run all checks
        runAllChecks: function (patient, vitals, medicines) {
            const allWarnings = [];

            // Get patient allergies
            const fullProfile = System.getPatients().find(p => p.id === patient.patientId);
            const allergies = fullProfile ? fullProfile.allergies : [];

            // Run all checks
            const drugWarnings = this.checkDrugInteractions(medicines);
            const allergyWarnings = this.checkAllergies(allergies, medicines);
            const vitalWarnings = this.analyzeVitals(vitals);

            allWarnings.push(...drugWarnings, ...allergyWarnings, ...vitalWarnings);

            // Calculate risk
            const risk = this.calculateRiskLevel(patient, vitals, medicines);

            return {
                warnings: allWarnings,
                risk: risk,
                hasAlerts: allWarnings.length > 0
            };
        }
    },


    // 🛡️ Audit Logger
    log: function (type, msg) {
        let logs = JSON.parse(localStorage.getItem('doc_audit')) || [];
        logs.unshift({
            time: new Date().toISOString(),
            type: type,
            msg: msg,
            user: "Dr. Rashmi"
        });
        localStorage.setItem('doc_audit', JSON.stringify(logs));
    },

    // 🔔 Notification System
    notify: function (title, msg, type = 'info') {
        let notifs = JSON.parse(localStorage.getItem('doc_notifications')) || [];
        notifs.unshift({
            id: Date.now(),
            title: title,
            msg: msg,
            type: type,
            read: false,
            time: new Date()
        });
        localStorage.setItem('doc_notifications', JSON.stringify(notifs));
        console.log(`[NOTIF] ${title}: ${msg}`);
    },

    // 📅 Follow-Up Tracker System
    FollowUpTracker: {
        getFollowUps: function () {
            const history = System.getHistory();
            const followUps = [];

            history.forEach(record => {
                if (record.followUpDate) {
                    const followUpDate = new Date(record.followUpDate);
                    const today = new Date();
                    const daysDiff = Math.ceil((followUpDate - today) / (1000 * 60 * 60 * 24));

                    followUps.push({
                        ...record,
                        followUpDate: followUpDate,
                        daysUntil: daysDiff,
                        isOverdue: daysDiff < 0,
                        isUpcoming: daysDiff >= 0 && daysDiff <= 7
                    });
                }
            });

            return followUps.sort((a, b) => a.followUpDate - b.followUpDate);
        },

        getOverdue: function () {
            return this.getFollowUps().filter(f => f.isOverdue);
        },

        getUpcoming: function () {
            return this.getFollowUps().filter(f => f.isUpcoming && !f.isOverdue);
        },

        getChronicPatients: function () {
            const history = System.getHistory();
            const patientVisits = {};

            // Count visits per patient in last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            history.forEach(record => {
                const visitDate = new Date(record.date);
                if (visitDate >= thirtyDaysAgo) {
                    if (!patientVisits[record.patientId]) {
                        patientVisits[record.patientId] = { count: 0, name: record.name, lastVisit: visitDate };
                    }
                    patientVisits[record.patientId].count++;
                    if (visitDate > patientVisits[record.patientId].lastVisit) {
                        patientVisits[record.patientId].lastVisit = visitDate;
                    }
                }
            });

            // Filter patients with >3 visits
            return Object.entries(patientVisits)
                .filter(([id, data]) => data.count >= 3)
                .map(([id, data]) => ({ patientId: id, ...data }));
        }
    },

    // --- PATIENT MANAGEMENT ---
    createPatient: function (type = 'Regular') {
        let queue = this.getQueue();
        const id = queue.length + 100;
        const isEmergency = type === 'Emergency';

        const p = {
            token: id,
            patientId: `P-${1000 + id}`,
            name: isEmergency ? `Emergency Patient ${id}` : `Walk-in Patient ${id}`,
            age: isEmergency ? Math.floor(Math.random() * 40) + 40 : Math.floor(Math.random() * 60) + 18,
            gender: Math.random() > 0.5 ? "Male" : "Female",
            complaint: isEmergency ? "Severe Chest Pain" : "General Checkup",
            type: type,
            status: "Waiting",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (isEmergency) {
            queue.push(p);
            this.log('SYS_EMERGENCY', 'Emergency Priority Patient Added!');
            this.notify('Emergency', 'New Critical Patient Arrived', 'emergency');
        } else {
            queue.push(p);
            this.log('SYS_EVENT', 'New walk-in patient added');
        }

        this.setQueue(queue);
        return p;
    },

    // --- BACKGROUND TASKS ---
    Tasks: {
        simulateRealTime: function () {
            const el = document.getElementById('realtime-clock');
            if (el) {
                const now = new Date();
                el.innerHTML = `<i class="fa-regular fa-clock"></i> ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
            }
        },

        simulateRandomEvents: function () {
            if (Math.random() < 0.1) { // Reduced chance
                System.createPatient('Regular');
                // Refresh Pulse
                const badge = document.querySelector('.notification-badge');
                if (badge) {
                    badge.classList.add('pulse-animation');
                    setTimeout(() => badge.classList.remove('pulse-animation'), 2000);
                }
            }
        }
    }
};

// --- INITIALIZE ON LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    System.init();
});
