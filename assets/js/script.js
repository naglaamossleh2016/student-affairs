// assets/js/script.js

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    if (!username || !password) {
      alert('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
 
    alert('تم تسجيل الدخول بنجاح!');
  });