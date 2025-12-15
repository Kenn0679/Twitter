module.exports = {
  apps: [
    {
      name: 'twitter',
      script: 'dist/index.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        TEN_BIEN: 'Gia tri'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
//file này dùng để cấu hình pm2 chạy project với các biến môi trường khác nhau cho development và production
//có 1 điều hay là khi pm2 gặp lỗi thì nó sẽ tự động khởi động lại ứng dụng mà không cần phải can thiệp thủ công
//cũng vì v, nếu thiếu file này thì pm2 sẽ không biết chạy project như thế nào nên sẽ báo lỗi sau đó sẽ liên tục restart ứng dụng :v
// pm2 start ecosystem.config.js || pm2 start ecosystem.config.js --env production
//lệnh trên dùng để khởi động project với pm2, nếu muốn chạy ở môi trường production thì thêm --env production vào cuối lệnh
//pm2 sẽ tự động lấy biến môi trường NODE_ENV từ file này để thiết lập môi trường chạy ứng dụng
//để biết thêm 1 thì bạn hãy chủ động lên trang chủ của pm2 để tìm hiểu thêm nhé :v
//đây là những gì mình tìm hiểu được về pm2 và cách sử dụng nó để quản lý ứng dụng Node.js (cuz this project is self-learning with ts for backend :v)
