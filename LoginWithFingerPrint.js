import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView, Platform, TouchableOpacity} from 'react-native';
import {NavigationActions} from 'react-navigation';
import Style from './Style.js';
import { Spinner } from 'components';
import PasswordWithIcon from 'components/InputField/Password.js';
import CustomError from 'components/Modal/Error.js';
import Confirm from 'components/Modal/ConfirmationModal.js'
import Api from 'services/api/index.js';
import CommonRequest from 'services/CommonRequest.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import Header from './Header';
import config from 'src/config';
import Pusher from 'services/Pusher.js';
import SystemVersion from 'services/System.js';
import { Player } from '@react-native-community/audio-toolkit';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import OtpModal from 'components/Modal/Otp.js';
import {Notifications, NotificationAction, NotificationCategory} from 'react-native-notifications';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { Alert } from 'react-native';
class Login extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      username: null,
      password: null,
      isLoading: false,
      token: null,
      error: 0,
      isResponseError: false,
      isOtpModal: false,
      blockedFlag: false,
      notifications: [],
      visible: false,
      showFingerPrint: false,
      notEmpty: false,
      isConfirmed: false,
    };
    this.audio = null;
  }
  
  async componentDidMount(){
    this.getTheme()
    console.log("[Not Empty storage]", await AsyncStorage.getItem('username') != null &&  await AsyncStorage.getItem('password') != null);
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
    }else{
      await this.setState({notEmpty: false})
      await this.setState({showFingerPrint: false})
    }
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


  test = () => {
    if(config.TEST == true){
      this.props.navigation.navigate('drawerStack');
      return true;
    }
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
    this.test();
    const { login } = this.props;
    if(this.state.token != null){
      this.setState({isLoading: true});
      Api.getAuthUser(this.state.token, (response) => {
        login(response, this.state.token);
        this.redirect('drawerStack')
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

  accountRetrieve(parameter){
    
  }

  async confirm(username, password){
      console.log(username, password);
      await AsyncStorage.setItem('username', username)
      await AsyncStorage.setItem('password', password)
      await this.setState({showFingerPrint: true})
  }

  async cancel(){
    await this.setState({showFingerPrint: false})
  }

  openModal(username, password){
    Alert.alert(
      "Finger Print",
      "Allow access to your finger print?",
      [
        {
          text: "Cancel", 
          onPress: () => this.cancel(),
          style: "cancel"
        },
        {
          text: "Allow",
          onPress: () => this.confirm(username, password)
        }
      ],
      {cancelable: false}
    )
  }

  submit(){
    this.test();
    const { username, password } = this.state;
    const { login } = this.props;
    if((username != null && username != '') && (password != null && password != '')){
      this.setState({isLoading: true, error: 0});
      // Login
      
      Api.authenticate(username, password, (response) => {
        if(response.error){
          this.setState({error: 2, isLoading: false});
        }
        if(response.token){
          const token = response.token;
          // this.setState({showFingerPrint: true})
          // this.setState({visible: true})
          Api.getAuthUser(response.token, (response) => {
            login(response, token);
            let parameter = {
              condition: [{
                value: response.id,
                clause: '=',
                column: 'id'
              }]
            }
            this.openModal(username, password);
            this.redirect('drawerStack')
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
    const { isLoading, error, isResponseError } = this.state;
    const {  blockedFlag, isOtpModal } = this.state;
    const { theme } = this.props.state;
    return (
      <ScrollView style={Style.ScrollView}>
        <View style={Style.MainContainer}>
          <Header params={"Login"}></Header>

          {error > 0 ? <View style={Style.messageContainer}>
            {error == 1 ? (
              <Text style={Style.messageText}>Please fill up the required fields.</Text>
            ) : null}

            {error == 2 ? (
              <Text style={Style.messageText}>Username and password didn't match.</Text>
            ) : null}
          </View> : null}
          
          <View style={Style.TextContainer}>
            <TextInput
              style={BasicStyles.formControl}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
              placeholder={'Username or Email'}
            />
            { /*<TextInput
              style={BasicStyles.formControl}
              onChangeText={(password) => this.setState({password})}
              value={this.state.password}
              placeholder={'********'}
              secureTextEntry={true}
            />*/}
            <PasswordWithIcon onTyping={(input) => this.setState({
              password: input
            })}/>
            <TouchableHighlight
              style={[BasicStyles.btn, {
                backgroundColor: theme ? theme.primary : Color.primary
              }]}
              onPress={() => this.submit()}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Login
              </Text>
            </TouchableHighlight>

            {/* <Confirm visible={this.state.visible} message={'Do you want to enable finger print scanning for easier login?'}
                onConfirm={() => {
                    this.openModal(this.state.username, this.state.password)
                }}
                onCLose={() => {
                    this.setState({visible: false})
                }}
            /> */}
            
            <TouchableHighlight
              style={[BasicStyles.btn, BasicStyles.btnWarning]}
              onPress={() => this.redirect('forgotPasswordStack')}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Forgot your Password?
              </Text>
            </TouchableHighlight>
            
              
            <View style={{
              height: 1,
              backgroundColor: Color.gray
            }}>
            </View>

            <View style={{
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{
                paddingTop: 10,
                paddingBottom: 10,
                color: Color.gray
              }}>Don't have an account?</Text>
            </View>
            <TouchableHighlight
              style={[BasicStyles.btn, {
                backgroundColor: theme ? theme.secondary : Color.secondary
              }]}
              onPress={() => this.redirect('registerStack')}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Register Now!
              </Text>
            </TouchableHighlight>
            {
              this.state.showFingerPrint == true ? 
              <View>
                  <TouchableOpacity
                    style={Style.fingerprints}
                    onPress={() => this.redirect('fingerPrintStack')}
                  >
                      <FontAwesomeIcon icon={faFingerprint} size={40} style={{color:Color.primary, display:'flex', marginLeft:'auto', marginRight:'auto'}}/>
                  </TouchableOpacity>
                  <View style={{
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{
                      paddingTop: 10,
                      paddingBottom: 10,
                      color: Color.gray
                    }}>Login with Finger Print?</Text>
                  </View>
              </View> : null
            }
          </View>
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
)(Login);
