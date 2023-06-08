// Importa los módulos necesarios
const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');


// URL del endpoint
const url = 'https://jsonplaceholder.typicode.com/users/{https://jsonplaceholder.typicode.com}';

// Función principal asincrónica
async function fetchDataAndSaveToMongoDB() {
  try {
    // Realiza la llamada GET al endpoint usando fetch
    const response = await fetch(url);
    const data = await response.json();

    // Verifica si la respuesta ya existe en la base de datos
    const existingData = await findDataInMongoDB();

    if (existingData) {
      // Si los datos ya existen, actualiza el campo "updatedAt" con la nueva fecha
      await updateDataInMongoDB(existingData._id);
    } else {
      // Si los datos no existen, inserta los datos en MongoDB con los campos "createdAt" y "updatedAt"
      await insertDataInMongoDB(data);
    }

    console.log('Tarea completada con éxito.');
  } catch (error) {
    console.error('Error al realizar la tarea:', error);
  }
}

// Función para buscar datos en MongoDB
async function findDataInMongoDB() {
  const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    const db = client.db('users-database');
    const collection = db.collection('users-collection');
    
    // Realiza una consulta para buscar los datos en la colección
    const data = await collection.findOne({ url });
    
    return data;
  } finally {
    client.close();
  }
}

// Función para actualizar los datos en MongoDB
async function updateDataInMongoDB(id) {
  const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    const db = client.db('users-database');
    const collection = db.collection('users-collection');
    
    // Actualiza el campo "updatedAt" con la nueva fecha
    const currentDate = new Date();
    await collection.updateOne({ _id: id }, { $set: { updatedAt: currentDate } });
  } finally {
    client.close();
  }
}

// Función para insertar datos en MongoDB
async function insertDataInMongoDB(data) {
  const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    await client.connect();
    const db = client.db('users-database');
    const collection = db.collection('users-collection');
    
    // Agrega los campos "createdAt" y "updatedAt" con la nueva fecha
    const currentDate = new Date();
    data.createdAt = currentDate;
    data.updatedAt = currentDate;

    // Inserta los datos en la colección
    await collection.insertOne(data);
  } finally {
    client.close();
  }
}

// Llama a la
fetchDataAndSaveToMongoDB();
