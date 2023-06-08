const express = require('express');
const app = express();
const axios = require('axios');
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017'; // URL de conexión a MongoDB
const dbName = 'myDatabase'; // Nombre de tu base de datos
const collectionName = 'users'; // Nombre de la colección

app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const response = await axios.get(`https://jsonplaceholder.typicode.com/users/${userId}`);
    const userData = response.data;

    // Establecer conexión con MongoDB
    const client = new MongoClient(uri);
    await client.connect();

    // Obtener la base de datos y la colección
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Verificar si el documento ya existe en la colección
    const existingDocument = await collection.findOne({ id: userData.id });

    if (existingDocument) {
      // Si el documento existe, actualiza el campo 'updatedAt'
      await collection.updateOne({ id: userData.id }, { $set: { updatedAt: new Date() } });
    } else {
      // Si el documento no existe, inserta el nuevo documento con los campos 'createdAt' y 'updatedAt'
      const document = { ...userData, createdAt: new Date(), updatedAt: new Date() };
      await collection.insertOne(document);
    }

    console.log('User data:', userData);
    client.close(); // Cierra la conexión con MongoDB

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error retrieving user data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
