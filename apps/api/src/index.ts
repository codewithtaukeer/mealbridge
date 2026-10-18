import 'dotenv/config';
import { createServer } from 'http';
import { app } from './app';
import { initializeSocketIO } from './socket';

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

httpServer.listen(PORT, () => {
  console.log(`\n🍽️  MealBridge API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Socket.IO: enabled\n`);
});
