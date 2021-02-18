import React, { Component } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  AppState
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import { connect } from 'react-redux';
import {NavigationActions} from 'react-navigation';
import { Spinner } from 'components';
import Api from 'services/api/index.js';
import CommonRequest from 'services/CommonRequest.js';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import CustomError from 'components/Modal/Error.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import styles from './Style';
import FingerprintPopup from './FingerPrint';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import config from 'src/config';
import Pusher from 'services/Pusher.js';
import SystemVersion from 'services/System.js';
import { Player } from '@react-native-community/audio-toolkit';
import {Notifications, NotificationAction, NotificationCategory} from 'react-native-notifications';
import Header from './Header';
import OtpModal from 'components/Modal/Otp.js';
import { ScrollView } from 'react-native-gesture-handler';

class FingerprintScan extends Component {

  constructor(props) {
    super(props);
    this.state = {
      errorMessage: undefined,
      biometric: undefined,
      popupShowed: false,
      username: null,
      password: null,
      isLoading: false,
      token: null,
      error: 0,
      isResponseError: false,
      isOtpModal: false,
      blockedFlag: false,
      notifications: [],
    };
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }

  handleFingerprintShowed = async() => {
    await this.setState({ popupShowed: true });
    console.log("?????????????????", this.state.popupShowed);
  };

  handleFingerprintDismissed = async() => {
    await this.setState({ popupShowed: false });
    console.log("<<<<<<<<<<<<<<<", this.state.popupShowed);
  };

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  detectFingerprintAvailable = () => {
    FingerprintScanner
      .isSensorAvailable()
      .catch(error => this.setState({ errorMessage: error.message, biometric: error.biometric }));
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState && this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      FingerprintScanner.release();
      this.detectFingerprintAvailable();
    }
    this.setState({ appState: nextAppState });
  }

  async componentDidMount(){
    this.getTheme()
    AppState.addEventListener('change', this.handleAppStateChange);
    // Get initial fingerprint enrolled
    this.detectFingerprintAvailable();
    let username = await AsyncStorage.getItem('username');
    let password = await AsyncStorage.getItem('password');
    this.setState({username: username})
    this.setState({password: password})
    if(config.versionChecker == 'store'){
      this.setState({isLoading: true})
      SystemVersion.checkVersion(response => {
        this.setState({isLoading: false})
        if(response == true){
          this.getData();
        }
      })
    }else{
      this.getData(); 
    }
    this.audio = new Player('assets/notification.mp3');
    const initialNotification = await Notifications.getInitialNotification();
    if (initialNotification) {
      this.setState({notifications: [initialNotification, ...this.state.notifications]});
    }
  }

  getTheme = async () => {
    try {
      const primary = await AsyncStorage.getItem(Helper.APP_NAME + 'primary');
      const secondary = await AsyncStorage.getItem(Helper.APP_NAME + 'secondary');
      const tertiary = await AsyncStorage.getItem(Helper.APP_NAME + 'tertiary');
      const fourth = await AsyncStorage.getItem(Helper.APP_NAME + 'fourth');
      if(primary != null && secondary != null && tertiary != null) {
        const { setTheme } = this.props;
        setTheme({
          primary: primary,
          secondary: secondary,
          tertiary: tertiary,
          fourth: fourth
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  requestPermissions() {
    Notifications.registerRemoteNotifications();
  }

  sendLocalNotification(title, body, route) {
    Notifications.postLocalNotification({
        title: title,
        body: body,
        extra: route
    });
  }


  redirect = (route) => {
    this.props.navigation.navigate(route);
  }

  playAudio = () => {
    if(this.audio){
      this.audio.play();
    }
  }

  login = () => {
    const { login } = this.props;
    if(this.state.token != null){
      this.setState({isLoading: true});
      Api.getAuthUser(this.state.token, (response) => {
        login(response, this.state.token);
        this.setState({isLoading: false});
      }, error => {
        this.setState({isResponseError: true})
      })
    }
  }

  getData = async () => {
    try {
      const token = await AsyncStorage.getItem(Helper.APP_NAME + 'token');
      if(token != null) {
        this.setState({token});
        this.login();
      }
    } catch(e) {
      // error reading value
    }
  }
  
  checkOtp = () => {
    const { user } = this.props.state;
    if(user.notification_settings != null){
      let nSettings = user.notification_settings
      if(parseInt(nSettings.email_otp) == 1 || parseInt(nSettings.sms_otp) == 1){
        this.setState({
          isOtpModal: true,
          blockedFlag: false
        })
        return
      }
    }
    this.props.navigation.navigate('drawerStack');
  }

  onSuccessOtp = () => {
    this.setState({isOtpModal: false})
    this.props.navigation.navigate('drawerStack');
  }

  submit(){
    const { username, password } = this.state;
    const { login } = this.props;
    if((username != null && username != '') && (password != null && password != '')){
      this.setState({isLoading: true, error: 0});
      // Login
      console.log(username, password);
      Api.authenticate(username, password, (response) => {
        if(response.error){
          this.setState({error: 2, isLoading: false});
        }
        if(response.token){
          const token = response.token;
          this.setState({showFingerPrint: true})
          this.setState({visible: true})
          Api.getAuthUser(response.token, (response) => {
            login(response, token);
            let parameter = {
              condition: [{
                value: response.id,
                clause: '=',
                column: 'id'
              }]
            }
            this.redirect('drawerStack')
            this.setState({isLoading: false, error: 0});  
          }, error => {
            this.setState({isResponseError: true})
          })
        }
      }, error => {
        console.log('error', error)
        this.setState({isResponseError: true})
        this.setState({showFingerPrint: false})
      })
      // this.props.navigation.navigate('drawerStack');
    }else{
      this.setState({error: 1});
    }
  }

  render() {
    const { errorMessage, biometric, popupShowed } = this.state;
    const { isLoading, error, isResponseError } = this.state;
    const {  blockedFlag, isOtpModal } = this.state;
    const { theme } = this.props.state;
    return (
        <ScrollView>
            <View style={styles.MainContainer}>

                <Header params={"Login"}></Header>

                  <TouchableOpacity
                      style={styles.fingerprint}
                      onPress={this.handleFingerprintShowed}
                      disabled={!!errorMessage}
                  >
                      <FontAwesomeIcon icon={faFingerprint} size={60} style={{color:Color.primary}}/>
                  </TouchableOpacity>
                  <Text>Tap the icon</Text>

                {errorMessage && (
                <Text style={styles.errorMessage}>
                    {errorMessage} {biometric}
                </Text>
                )}
                <TouchableOpacity
                style={styles.fingerprint}
                onPress={() => this.redirect('loginStack')}
                disabled={!!errorMessage}
                >
                    <Text style={{marginTop: 200}}>Return to Login</Text>
                </TouchableOpacity>
                {popupShowed && (
                <FingerprintPopup
                    style={styles.popup}
                    handlePopupDismissed={() => this.handleFingerprintDismissed()}
                    handlePopupDismissedLegacy={() => this.handleFingerprintDismissed()}
                    onAuthenticate={() => this.submit()}
                />
                )}
            </View>

            <OtpModal
                visible={isOtpModal}
                title={blockedFlag == false ? 'Authentication via OTP' : 'Blocked Account'}
                actionLabel={{
                    yes: 'Authenticate',
                    no: 'Cancel'
                }}
                onCancel={() => this.setState({isOtpModal: false})}
                onSuccess={() => this.onSuccessOtp()}
                onResend={() => {
                    this.setState({isOtpModal: false})
                    this.submit()
                }}
                error={''}
                blockedFlag={blockedFlag}
            ></OtpModal>

            {isLoading ? <Spinner mode="overlay"/> : null }
            {isResponseError ? <CustomError visible={isResponseError} onCLose={() => {
            this.setState({isResponseError: false, isLoading: false})
            }}/> : null}
      </ScrollView>
    );
  }
}
const mapStateToProps = state => ({ state: state });

const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    login: (user, token) => dispatch(actions.login(user, token)),
    logout: () => dispatch(actions.logout()),
    setTheme: (theme) => dispatch(actions.setTheme(theme)),
    setNotifications: (unread, notifications) => dispatch(actions.setNotifications(unread, notifications)),
    updateNotifications: (unread, notification) => dispatch(actions.updateNotifications(unread, notification)),
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message)),
    setMessenger: (unread, messages) => dispatch(actions.setMessenger(unread, messages)),
    updateMessengerGroup: (messengerGroup) => dispatch(actions.updateMessengerGroup(messengerGroup)),
    setMessengerGroup: (messengerGroup) => dispatch(actions.setMessengerGroup(messengerGroup)),
    setMessagesOnGroup: (messagesOnGroup) => dispatch(actions.setMessagesOnGroup(messagesOnGroup)),
    updateMessagesOnGroupByPayload: (messages) => dispatch(actions.updateMessagesOnGroupByPayload(messages)),
    setSearchParameter: (searchParameter) => dispatch(actions.setSearchParameter(searchParameter)),
    setSystemNotification: (systemNotification) => dispatch(actions.setSystemNotification(systemNotification)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FingerprintScan);
