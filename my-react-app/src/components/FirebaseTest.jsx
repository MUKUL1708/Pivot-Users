import React, { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

const FirebaseTest = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testWrite = async () => {
    setIsLoading(true);
    setStatus('Testing write operation...');
    
    try {
      const testData = {
        test: true,
        message: 'Test message from React',
        timestamp: new Date().toISOString(),
        randomNumber: Math.floor(Math.random() * 1000)
      };

      console.log('Attempting to write test data:', testData);
      
      const docRef = await addDoc(collection(db, 'test'), testData);
      
      setStatus(`✅ SUCCESS! Document written with ID: ${docRef.id}`);
      console.log('Document written with ID: ', docRef.id);
      
    } catch (error) {
      setStatus(`❌ ERROR: ${error.message}`);
      console.error('Error writing document: ', error);
      console.error('Full error object:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testRead = async () => {
    setIsLoading(true);
    setStatus('Testing read operation...');
    
    try {
      console.log('Attempting to read test collection...');
      
      const querySnapshot = await getDocs(collection(db, 'test'));
      
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      
      setStatus(`✅ SUCCESS! Read ${docs.length} documents from test collection`);
      console.log('Documents read:', docs);
      
    } catch (error) {
      setStatus(`❌ ERROR: ${error.message}`);
      console.error('Error reading documents: ', error);
      console.error('Full error object:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testHiveWrite = async () => {
    setIsLoading(true);
    setStatus('Testing hive collection write...');
    
    try {
      const testHiveData = {
        name: 'Test User',
        mobile: '1234567890',
        course: 'B.Tech',
        branch: 'Computer Science',
        year: '3rd Year',
        codingLanguages: ['JavaScript', 'Python'],
        campusName: 'Test University',
        campusLocation: 'Test City, Test State',
        hiveName: 'Test Hive',
        expectedAudience: '10-20',
        facultyAdvisorName: 'Dr. Test',
        facultyAdvisorContact: 'test@test.com',
        leadershipExperience: 'Test leadership experience',
        longTermVision: 'Test vision',
        termsAccepted: true,
        createdAt: new Date().toISOString(),
        status: 'pending',
        isActive: false,
        memberCount: 0
      };

      console.log('Attempting to write test hive data:', testHiveData);
      
      const docRef = await addDoc(collection(db, 'hives'), testHiveData);
      
      setStatus(`✅ SUCCESS! Hive document written with ID: ${docRef.id}`);
      console.log('Hive document written with ID: ', docRef.id);
      
    } catch (error) {
      setStatus(`❌ ERROR: ${error.message}`);
      console.error('Error writing hive document: ', error);
      console.error('Full error object:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ccc', 
      borderRadius: '10px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔥 Firebase Connection Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Project ID:</strong> fir-mart-e9e21
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={testWrite} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Test Write to 'test' collection
        </button>
        
        <button 
          onClick={testRead} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Test Read from 'test' collection
        </button>
        
        <button 
          onClick={testHiveWrite} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#FF9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Test Write to 'hives' collection
        </button>
      </div>
      
      <div style={{ 
        minHeight: '50px', 
        padding: '10px', 
        backgroundColor: status.includes('SUCCESS') ? '#d4edda' : status.includes('ERROR') ? '#f8d7da' : '#e2e3e5',
        border: '1px solid ' + (status.includes('SUCCESS') ? '#c3e6cb' : status.includes('ERROR') ? '#f5c6cb' : '#d6d8db'),
        borderRadius: '5px',
        color: status.includes('SUCCESS') ? '#155724' : status.includes('ERROR') ? '#721c24' : '#383d41'
      }}>
        {isLoading ? '⏳ Loading...' : status || 'Click a button to test Firebase connection'}
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>Note:</strong> Check the browser console for detailed logs
      </div>
    </div>
  );
};

export default FirebaseTest;
