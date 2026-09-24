const { createApp, ref, shallowRef, reactive, computed, onMounted } = Vue;

createApp({
    setup() {
        // สร้างอินสแตนซ์จากคลาส OOP ที่อยู่ในไฟล์ oop.js
        const authManager = new AuthManager();
        const sysManager = new ReportManager();
        const triggerRender = ref(0); // ตัวแปรสำหรับบังคับให้ Vue อัปเดตหน้าจอเมื่อข้อมูลใน OOP เปลี่ยนแปลง

        // State ของระบบ
        const currentUser = shallowRef(null);
        const loginForm = reactive({ studentId: '', contact: '' });
        const reportForm = reactive({ type: 'lost', itemName: '', location: '', specificDetail: '' });
        const searchQuery = ref('');
        const filterType = ref('all');

        // โหลดข้อมูลเริ่มต้นจาก data.json
        onMounted(async () => {
            try {
                const response = await fetch('data.json');
                const data = await response.json();
                
                data.reports.forEach(item => {
                    const user = new User(item.studentId, item.contact);
                    let reportObj = item.type === 'lost' 
                        ? new LostReport(item.itemName, item.location, user, item.specificDetail, item.status)
                        : new FoundReport(item.itemName, item.location, user, item.specificDetail, item.status);
                    
                    sysManager.addReport(reportObj);
                });
                triggerRender.value++; 
            } catch (error) {
                console.log("Starting with empty data (no data.json found).");
            }

            // ตรวจสอบว่าเคยล็อกอินก่อนที่รีเฟรชหรือไม่ (กด F5 แล้วไม่เด้งออก)
            const savedLogin = localStorage.getItem('upLogin');
            if (savedLogin) {
                try {
                    const { studentId, contact } = JSON.parse(savedLogin);
                    currentUser.value = new User(studentId, contact);
                } catch (e) {
                    localStorage.removeItem('upLogin');
                }
            }
        });

        // ระบบ Login / Logout
        const login = () => {
            try {
                currentUser.value = authManager.login(loginForm.studentId, loginForm.contact);
                localStorage.setItem('upLogin', JSON.stringify({ studentId: loginForm.studentId, contact: loginForm.contact }));
            } catch (error) {
                alert(error.message); // แจ้งเตือนถ้ารหัสไม่ครบ 8 หลัก
            }
        };
        
        const logout = () => {
            authManager.logout();
            currentUser.value = null;
            localStorage.removeItem('upLogin');
            loginForm.studentId = ''; 
            loginForm.contact = '';
        };

        // ระบบบันทึกข้อมูล
        const submitForm = () => {
            let newReport = reportForm.type === 'lost'
                ? new LostReport(reportForm.itemName, reportForm.location, currentUser.value, reportForm.specificDetail)
                : new FoundReport(reportForm.itemName, reportForm.location, currentUser.value, reportForm.specificDetail);

            sysManager.addReport(newReport);
            
            // ล้างฟอร์มหลังจากบันทึก
            reportForm.itemName = ''; 
            reportForm.location = ''; 
            reportForm.specificDetail = '';
            
            alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
            triggerRender.value++;
        };

        // เช็คสิทธิ์การเป็นเจ้าของโพสต์
        const isOwner = (report) => {
            if (!currentUser.value) return false;
            return report.getReporter().getStudentId() === currentUser.value.getStudentId();
        };

        // เปลี่ยนสถานะเป็นส่งคืนแล้ว
        const resolveReport = (id) => {
            if(confirm("ยืนยันว่าส่งคืนของชิ้นนี้เรียบร้อยแล้ว?")) {
                const success = sysManager.markAsResolved(id, currentUser.value);
                if (success) {
                    triggerRender.value++;
                } else {
                    alert("คุณไม่มีสิทธิ์แก้ไขโพสต์นี้");
                }
            }
        };

        // กรองข้อมูลตามคำค้นหาและประเภท
        const filteredReports = computed(() => {
            triggerRender.value; // กระตุ้นให้คำนวณใหม่เมื่อมีการเพิ่ม/แก้ไขข้อมูล
            return sysManager.filterReports(searchQuery.value, filterType.value);
        });

        return {
            currentUser, loginForm, reportForm, searchQuery, filterType, filteredReports,
            login, logout, submitForm, isOwner, resolveReport
        }
    }
}).mount('#app');