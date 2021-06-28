import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView, Platform} from 'react-native';
import {NavigationActions} from 'react-navigation';
import Style from './Style.js';
import { Spinner } from 'components';
import PasswordWithIcon from 'components/InputField/Password.js';
import CustomError from 'components/Modal/Error.js';
import Api from 'services/api/index.js';
import CommonRequest from 'services/CommonRequest.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import Header from '../Header';
import config from 'src/config';
import Pusher from 'services/Pusher.js';
import SystemVersion from 'services/System.js';
import { Player } from '@react-native-community/audio-toolkit';
import OtpModal from 'components/Modal/Otp.js';
import {Notifications, NotificationAction, NotificationCategory} from 'react-native-notifications';
import Button from 'components/Form/Button';
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore';
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
      user: null,
    };
    this.audio = null;
  }

  
  async componentDidMount(){
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
  }


  redirect = (route) => {
    this.props.navigation.navigate(route);
  }

  getData = async () => {
    const { login } = this.props;
    console.log('getting data', await AsyncStorage.getItem(Helper.APP_NAME + 'uid'));
    try {
      const token = await AsyncStorage.getItem(Helper.APP_NAME + 'uid');
      if(token != null) {
        this.setState({isLoading: true, error: 0});
        firestore().collection('users')
          .where('customerId', '==', token)
          .get()
          .then(response => {
            response.forEach(async el => {
              let data = el.data()
              if(el.data() !== null){
                console.log('.............', el);
                login(el.data(), data.customerId)
                this.setState({isLoading: false, error: 0});
                this.props.navigation.navigate('homePageStack')
              }
            })
          })
      }
    } catch(e) {
      // error reading value
    }
  }

submit(){
    const { username, password } = this.state;
    const { login } = this.props;
    if((username != null && username != '') && (password != null && password != '')){
      this.setState({isLoading: true, error: 0});
      auth().signInWithEmailAndPassword(username.trim(), password).then(res => {
        if(res !== null){
          firestore().collection('users')
          .where('email', '==', res.user.email)
          .get()
          .then(response => {
            response.forEach(async el => {
              if(el.data() !== null){
                let data = el.data()
                login(el.data(), data.customerId)
                await AsyncStorage.setItem(Helper.APP_NAME + 'uid', data.customerId)
                this.setState({isLoading: false, error: 0});
                this.props.navigation.navigate('homePageStack')
              }
            })
          })
        }
      }).catch(err => {
        this.setState({isLoading: false, error: 1});
        console.log('[ERROR]:' ,err);
      });
    }else{
      this.setState({error: 1});
    }
  }

  render() {
    const { isLoading, error, isResponseError } = this.state;
    const {  blockedFlag, isOtpModal } = this.state;
    const { theme } = this.props.state;
    return (
      <ScrollView style={Style.ScrollView}
        showsVerticalScrollIndicator={false}>
        <View style={[Style.MainContainer, {backgroundColor: '#F5F5F5'}]}>
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
          
          <View style={[Style.TextContainer]}>
            <TextInput
              style={{
                ...BasicStyles.standardFormControl,
                marginBottom: 20,
              }}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
              placeholder={'Email'}
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
            

            <Button
              onClick={() => this.submit()}
              textStyle={{color:'black'}}
              title={'Login'}
              style={{
                backgroundColor: theme ? theme.primary : Color.primary,
                width: '100%',
                marginBottom: 20,
                marginTop: 20,
                borderRadius: BasicStyles.standardBorderRadius,
                ...BasicStyles.standardShadow,
              }}
            />

            
            <Button
              onClick={() => this.redirect('forgotPasswordStack')}
              title={'Forgot your Password?'}
              textStyle={{color:'black'}}
              style={{
                backgroundColor: 'transparent',
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
                marginBottom: 100,
                borderRadius: BasicStyles.standardBorderRadius,
                ...BasicStyles.standardShadow,
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
