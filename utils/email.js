const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1 > create transporter

  var transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: +process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  //   const transport = nodemailer.createTransport({
  //     host: 'smtp.mailtrap.io',
  //     port: 2525,
  //     auth: {
  //       user: 'd9c03512a7a455',
  //       pass: '002dd8df0e8278',
  //     },
  //   });
  // 2 > define email options
  const mailOptions = {
    from: 'Smit Patel <smitpatel077@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //   html:
  };
  // 3 > send the email

  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
