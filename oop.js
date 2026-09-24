// ==========================================
// 1. Class User (แสดง Encapsulation ซ่อนข้อมูล)
// ==========================================
class User {
    #studentId;
    #contact;

    constructor(studentId, contact) {
        this.#studentId = studentId;
        this.#contact = contact;
    }
    getStudentId() { return this.#studentId; }
    getContact() { return this.#contact; }
}

// ==========================================
// 2. Class AuthManager (จัดการการ Login และ Validation)
// ==========================================
class AuthManager {
    #currentUser = null;

    login(studentId, contact) {
        const isEightDigits = /^\d{8}$/.test(studentId);
        if (!isEightDigits) {
            throw new Error("กรุณากรอกรหัสนิสิตเป็นตัวเลข 8 หลักเท่านั้น");
        }
        if (contact.length > 10) {
            throw new Error("เบอร์โทรต้องมีไม่เกิน 10 หลัก");
        }
        if (!/^0\d{9}$/.test(contact)) {
            throw new Error("เบอร์โทรต้องขึ้นต้นด้วย 0 และเป็นตัวเลข 10 หลัก");
        }
        this.#currentUser = new User(studentId, contact);
        return this.#currentUser;
    }

    logout() { this.#currentUser = null; }
    getCurrentUser() { return this.#currentUser; }
    isLoggedIn() { return this.#currentUser !== null; }
}

// ==========================================
// 3. Class ItemReport (Base Class แสดง Encapsulation)
// ==========================================
class ItemReport {
    #id;
    #itemName;
    #location;
    #reporter;
    #status;
    #date;

    constructor(itemName, location, reporter, status = 'กำลังตามหา') {
        this.#id = 'REP-' + Date.now().toString().slice(-6);
        this.#itemName = itemName;
        this.#location = location;
        this.#reporter = reporter; // Object ของ User
        this.#status = status;
        this.#date = new Date().toLocaleDateString('th-TH');
    }

    getId() { return this.#id; }
    getItemName() { return this.#itemName; }
    getLocation() { return this.#location; }
    getReporter() { return this.#reporter; }
    getStatus() { return this.#status; }
    getDate() { return this.#date; }
    
    setStatus(newStatus) { this.#status = newStatus; }

    // Polymorphism: เตรียมให้คลาสลูกมา Override
    getSpecificDetails() { return "รายละเอียดเพิ่มเติม"; }
    getTypeBadge() { return { text: 'ทั่วไป', colorClass: 'bg-gray-100 text-gray-800' }; }
}

// ==========================================
// 4. Class LostReport (ของหาย - แสดง Inheritance)
// ==========================================
class LostReport extends ItemReport {
    #uniqueFeatures;

    constructor(itemName, location, reporter, uniqueFeatures, status) {
        super(itemName, location, reporter, status);
        this.#uniqueFeatures = uniqueFeatures;
    }
    
    // Polymorphism
    getSpecificDetails() {
        return `<span class="font-bold text-red-600">จุดสังเกต:</span> ${this.#uniqueFeatures}`;
    }
    getTypeBadge() {
        return { text: 'ของหาย (Lost)', colorClass: 'bg-red-100 text-red-700 border-red-200' };
    }
}

// ==========================================
// 5. Class FoundReport (พบของ - แสดง Inheritance)
// ==========================================
class FoundReport extends ItemReport {
    #dropOffLocation;

    constructor(itemName, location, reporter, dropOffLocation, status) {
        super(itemName, location, reporter, status);
        this.#dropOffLocation = dropOffLocation;
    }
    
    // Polymorphism
    getSpecificDetails() {
        return `<span class="font-bold text-green-600">ฝากของไว้ที่:</span> ${this.#dropOffLocation}`;
    }
    getTypeBadge() {
        return { text: 'พบของ (Found)', colorClass: 'bg-green-100 text-green-700 border-green-200' };
    }
}

// ==========================================
// 6. Class ReportManager (จัดการระบบข้อมูลส่วนกลาง)
// ==========================================
class ReportManager {
    #reports = [];

    addReport(report) { this.#reports.unshift(report); }
    getAllReports() { return this.#reports; }

    filterReports(keyword, typeFilter) {
        return this.#reports.filter(report => {
            const matchText = report.getItemName().toLowerCase().includes(keyword.toLowerCase());
            let matchType = true;
            if (typeFilter === 'lost') matchType = report instanceof LostReport;
            if (typeFilter === 'found') matchType = report instanceof FoundReport;
            return matchText && matchType;
        });
    }

    markAsResolved(reportId, currentUser) {
        const report = this.#reports.find(r => r.getId() === reportId);
        if (report) {
            if (report.getReporter().getStudentId() === currentUser.getStudentId()) {
                report.setStatus('ส่งคืนเรียบร้อยแล้ว ✅');
                return true;
            } else {
                return false;
            }
        }
    }
}