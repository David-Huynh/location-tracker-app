import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useInterval } from './useInterval';
const Buffer = require("buffer").Buffer;


const LOCATION_TASK_NAME = 'left-or-entered-region';
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data: { eventType, region }, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    console.log(error.message);
    return;
  }
  const params = new URLSearchParams();
  if (eventType === Location.GeofencingEventType.Enter) {
    // User entered region
    params.append('state', true);
  } else if (eventType === Location.GeofencingEventType.Exit) {
    // User exited region
    params.append('state', false);
  }
  fetch(`${process.env.ENDPOINT}/`, {
    method:'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(process.env.USERNAME + ":" + process.env.ADMIN_PASS).toString('base64')
    },
    body: params,
  }).then(response => {
    console.log(`response: ${response.status}`);
  }).catch(error => {
    console.log(`error: ${error}`);
  });
});

const App = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  //First time useEffect runs and gets the location permission
  useEffect(() => {
    (async () => {
      let { foregroundStatus } = await Location.getForegroundPermissionsAsync();
      let { backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      if (backgroundStatus === Location.PermissionStatus.DENIED || foregroundStatus === Location.PermissionStatus.DENIED) {
        let { foregroundPermission } = await Location.requestForegroundPermissionsAsync();
        let { backgroundPermission } = await Location.requestBackgroundPermissionsAsync();
        if (foregroundPermission !== 'granted' || backgroundPermission !== 'granted') {
          setErrorMsg('Permission to access location was denies');
          return;
        }
      }
      setErrorMsg(null);
      await Location.startGeofencingAsync(LOCATION_TASK_NAME, [{latitude: Number(process.env.LATITUDE), longitude: Number(process.env.LONGITUDE), radius: 100}])
    })();
  }, []);
  
  const setLocationState = async () => {
    let location = await Location.getLastKnownPositionAsync();
    setLocation(`${location.coords.latitude} ${location.coords.longitude}`);
  }
  setLocationState();
  useInterval(setLocationState, 60000);
  return (
    <View style={styles.container}>
      <Text>{location}</Text>
      <Text>{errorMsg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;