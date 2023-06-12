import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import retry from 'async-retry';
import { MongoClient } from 'mongodb';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: number;
}

const app = express();
const PORT = 3000;

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'myDatabase';
const collectionName = 'users';

app.use(express.json());

// Middleware for validating JWT token
const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, 'secret_key') as JwtPayload;

    if (decoded.userId && decoded.userRole === 'ADMIN') {
      req.userId = decoded.userId;
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Login route to fetch JWT token
app.post('/login', (req: Request, res: Response) => {
  // Authenticate user credentials and generate JWT token
  const userId = 1; // Replace with actual user authentication logic
  const userRole = 'ADMIN'; // Replace with actual user authentication logic
  const token = jwt.sign({ userId, userRole }, 'secret_key');

  res.json({ token });
});

// Route for GET /users
app.get('/users', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await retry(
      async () => {
        return axios.get('https://jsonplaceholder.typicode.com/users');
      },
      { retries: 3 }
    );

    const users = response.data.map((user: any) => ({
      id: user.id,
      prefix: '',
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ')[1],
      email: user.email,
      address: `${user.address.street} ${user.address.suite} ${user.address.city} ${user.address.zipcode}`,
      geolocation: `(${user.address.geo.lat}, ${user.address.geo.lng})`,
      companyName: user.company.name,
    }));

    res.json(users);
  } catch (error) {
    console.error('Error retrieving user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Connect to MongoDB and start the server
app.listen(PORT, async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log('Connected to MongoDB');

    // Perform MongoDB operations if needed

    client.close();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }

  console.log(`Server listening on port ${PORT}`);
});
