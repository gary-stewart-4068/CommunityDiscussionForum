
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));

// Export the app object for testing
if (require.main === module) {
  const createInitialAdmin = require('./scripts/createInitialAdmin');
  const startServer = async () => {
    try {
      await connectDB();

      // Ensure an initial Admin account exists
      await createInitialAdmin();

      // Start the server
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
      console.error('Error starting the server:', error.message);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = app
