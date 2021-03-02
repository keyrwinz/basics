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
import { Player } from '@react-native-community/audio-toolkit';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import OtpModal from 'components/Modal/Otp.js';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { fcmService } from 'services/broadcasting/FCMService';
import { localNotificationService } from 'services/broadcasting/LocalNotificationService';
import FingerPrintScanner from './FingerPrintScanner'
import { Alert } from 'react-native';
import Button from 'components/Form/Button';
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
  
  // async componentDidUpdate(){
  //   console.log("[Update]");
    
  // }
  async storageChecker(){
    console.log("[Not Empty storage]", await AsyncStorage.getItem('username') != null &&  await AsyncStorage.getItem('password') != null);
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
    }else{
      await this.setState({notEmpty: false})
      await this.setState({showFingerPrint: false})
    }
  }

  async componentDidMount(){
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
    }else{
      await this.setState({notEmpty: false})
      await this.setState({showFingerPrint: false})
    }

    this.infocus = this.props.navigation.addListener('didfocus', () => {
      this.storageChecker()
    })
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


  firebaseNotification(){
    const { user } = this.props.state;
    if(user == null){
      return
    }
    fcmService.registerAppWithFCM()
    fcmService.register(this.onRegister, this.onNotification, this.onOpenNotification)
    localNotificationService.configure(this.onOpenNotification, 'Payhiram')
    fcmService.subscribeTopic('Message')
    fcmService.subscribeTopic('Notifications')
    this.retrieveNotification()
    // return () => {
    //   console.log("[App] unRegister")
    //   fcmService.unRegister()
    //   localNotificationService.unRegister()
    // }
  }

  retrieveNotification = () => {
    const { setNotifications } = this.props;
    const { user } = this.props.state;
    if(user == null){
      return
    }
    let parameter = {
      condition: [{
        value: user.id,
        clause: '=',
        column: 'to'
      }],
      limit: 10,
      offset: 0
    }
    Api.request(Routes.notificationsRetrieve, parameter, notifications => {
      console.log("[RESTRIEVE]", notifications.data)
      setNotifications(notifications.size, notifications.data)
    }, error => {
    })
  }

  onRegister = (token) => {
    console.log("[App] onRegister", token)
  }

  onOpenNotification = (notify) => {
    // console.log("[App] onOpenNotification", notify)
  }

  onNotification = (notify) => {
    const { user } = this.props.state;
    // console.log("[App] onNotification", notify)
    let { data } = notify
    if(user == null || data == null){
      return
    }
    switch(data.topic.toLowerCase()){
      case 'message': {
          const { messengerGroup } = this.props.state;
          let members = JSON.parse(data.members)
          console.log('members', members)
          if(messengerGroup == null && members.indexOf(user.id) > -1){
            console.log('[messengerGroup] on empty', data)
            const { setUnReadMessages } = this.props;
            setUnReadMessages(data)
            return
          }
          if(parseInt(data.messenger_group_id) === messengerGroup.id && members.indexOf(user.id) > -1){
            if(parseInt(data.account_id) != user.id){
              const { updateMessagesOnGroup } = this.props;
              updateMessagesOnGroup(data); 
            }
            return
          }
        }
        break
      case 'notifications': {
          if(parseInt(data.to) == user.id){
            console.log("[Notifications] data", data)
            const { updateNotifications } = this.props;
            updateNotifications(1, data)
          }
        }
        break
    }

    // const options = {
    //   soundName: 'default',
    //   playSound: true
    // }

    // localNotificationService.showNotification(
    //   0,
    //   notify.title,
    //   notify.body,
    //   notify,
    //   options,
    //   "test"
    // )
  }

  login = () => {
    this.test();
    const { login } = this.props;
    if(this.state.token != null){
      this.setState({isLoading: true});
      Api.getAuthUser(this.state.token, (response) => {
        login(response, this.state.token);
        this.setState({isLoading: false});
        if(response.username){
          this.firebaseNotification()
          this.redirect('drawerStack')
        }
      }, error => {
        this.setState({isResponseError: true})
      })
    }
  }

  getData = async () => {
    try {
      const token = await AsyncStorage.getItem(Helper.APP_NAME + 'token');
      if(token != null && token != '') {
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
      this.setState({showFingerPrint: true})
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
            this.setState({isLoading: false, error: 0});
            if(this.state.notEmpty == true){
              console.log("[notEmpty]", this.state.notEmpty);
            }else{
              this.openModal(username, password);
            }
            if(response.username){
              this.firebaseNotification()
              this.redirect('drawerStack')
            }
            
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
      <ScrollView
        style={Style.ScrollView}
        showsVerticalScrollIndicator={false}>
        <View style={{
          flex: 1
        }}>
          <Header params={"Login"}></Header>

          {error > 0 ? <View style={{
            ...Style.messageContainer
          }}>
            {error == 1 ? (
              <Text style={{
                ...Style.messageText,
                fontSize: BasicStyles.standardFontSize
              }}>Please fill up the required fields.</Text>
            ) : null}

            {error == 2 ? (
              <Text style={{
                ...Style.messageText,
                fontSize: BasicStyles.standardFontSize
              }}>Username and password didn't match.</Text>
            ) : null}
          </View> : null}
          
          <View style={Style.TextContainer}>
            <TextInput
              style={{
                ...BasicStyles.standardFormControl,
                marginBottom: 20
              }}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
              placeholder={'Username or Email'}
            />

            <PasswordWithIcon
              onTyping={(input) => this.setState({
                password: input
              })}
              />


            <View style={{
              width: '100%',
              marginTop: 20
            }}>
            {
              this.state.showFingerPrint == true && (
                <FingerPrintScanner navigate={() => this.redirect('drawerStack')}/>
              )
            }
            </View>

            <Button
              onClick={() => this.submit()}
              title={'Login'}
              style={{
                backgroundColor: theme ? theme.primary : Color.primary,
                width: '100%',
                marginBottom: 20
              }}
            />

            {/* <Confirm visible={this.state.visible} message={'Do you want to enable finger print scanning for easier login?'}
                onConfirm={() => {
                    this.openModal(this.state.username, this.state.password)
                }}
                onCLose={() => {
                    this.setState({visible: false})
                }}
            /> */}

            <Button
              onClick={() => this.redirect('forgotPasswordStack')}
              title={'Forgot your Password?'}
              style={{
                backgroundColor: Color.warning,
                width: '100%',
                marginBottom: 20
              }}
            />
              
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

            <Button
              onClick={() => this.redirect('registerStack')}
              title={'Register Now!'}
              style={{
                backgroundColor: theme ? theme.secondary : Color.secondary,
                width: '100%',
                marginBottom: 100
              }}
            />

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
    setUnReadMessages: (messages) => dispatch(actions.setUnReadMessages(messages)),
    setNotifications: (unread, notifications) => dispatch(actions.setNotifications(unread, notifications)),
    updateNotifications: (unread, notification) => dispatch(actions.updateNotifications(unread, notification)),
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message)),
    setMessenger: (unread, messages) => dispatch(actions.setMessenger(unread, messages)),
    updateMessengerGroup: (messengerGroup) => dispatch(actions.updateMessengerGroup(messengerGroup)),
    setMessengerGroup: (messengerGroup) => dispatch(actions.setMessengerGroup(messengerGroup)),
    setMessagesOnGroup: (messagesOnGroup) => dispatch(actions.setMessagesOnGroup(messagesOnGroup)),
    updateMessagesOnGroupByPayload: (messages) => dispatch(actions.updateMessagesOnGroupByPayload(messages)),
    setSearchParameter: (searchParameter) => dispatch(actions.setSearchParameter(searchParameter)),
    setSystemNotification: (systemNotification) => dispatch(actions.setSystemNotification(systemNotification))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
