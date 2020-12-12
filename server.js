const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((con) => console.log('Database Connected'))
  .catch((err) => console.log('Database Connection failed'));

const app = require('./app');
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}...`);
});
