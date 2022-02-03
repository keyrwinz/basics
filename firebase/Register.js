import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView} from 'react-native';
import Style from './Style.js';
import { Spinner } from 'components';
import Api from 'services/api/index.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import CustomError from 'components/Modal/Error.js';
import PasswordWithIcon from 'components/InputField/Password.js';
import Header from '../Header';
import config from 'src/config';
import Button from 'components/Form/Button';
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore';
import { Base64 } from 'js-base64';
class Register extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      isLoading: false,
      token: null,
      error: 0,
      errorMessage: null,
      isResponseError: false
    };
  }
  
  componentDidMount(){
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }
  
  submit(){
    const { username, email, password, firstName, lastName } = this.state;
    if(this.validate() == false){
      return
    }
    let parameter = {
      active: false,
      customerId: '1',
      device: Base64.encode(password),
      firstName: firstName,
      lastName: lastName,
      merchantStatus: 'unavailable',
      rating: 0,
      ts: 'dfsfsa',
      username: username,
      email: email,
      verifiedEmail: false
    }
    console.log('PARAMETER', parameter);
    this.setState({isLoading: true})
    auth().createUserWithEmailAndPassword(email, password).then(res => {
      console.log('[RESPONSE===]', res);
      res.user.updateProfile({
        displayName: username
      })
      firestore().collection('users').add({
        active: false,
        customerId: res.user.uid,
        device: Base64.encode(password),
        firstName: firstName,
        lastName: lastName,
        merchantStatus: 'unavailable',
        rating: 0,
        ts: new Date().getTime(),
        username: username,
        email: email,
        verifiedEmail: res.user.emailVerified
      }).then(response => {
        this.setState({isLoading: false})
        if(response !== null){
          this.redirect('loginStack')
        }
        console.log('[CREATED]', response);
      }).catch(err => {
        this.setState({isLoading: false})
        this.setState({errorMessage: err})
      })
    }).catch(error => {
      this.setState({isLoading: false})
      this.setState({errorMessage: error})
    })
  }

  validate(){
    const { username, email, password, confirmPassword } = this.state;
    if(username.length >= 6 &&
      email !== '' &&
      password !== '' &&
      password.length >= 6 &
      password.localeCompare(confirmPassword) === 0 &&
      Helper.validateEmail(email) === true){
      return true
    }else if(email !== '' && Helper.validateEmail(email) === false){
      this.setState({errorMessage: 'You have entered an invalid email address.'})
      return false
    }else if(username !== '' && username.length < 6){
      this.setState({errorMessage: 'Username must be atleast 6 characters.'})
      return false
    }else if(password !== '' && password.length < 6){
       this.setState({errorMessage: 'Password must be atleast 6 characters.'})
       return false
    }else if(password !== '' && password.localeCompare(confirmPassword) !== 0){
      this.setState({errorMessage: 'Password did not match.'})
      return false
   }else{ 
      this.setState({errorMessage: 'Please fill in all required fields.'})
      return false
    }
  }

  render() {
    const { isLoading, errorMessage, isResponseError } = this.state;
    const { theme } = this.props.state;
    return (
      <ScrollView
        style={Style.ScrollView}
        showsVerticalScrollIndicator={false}>
        <View style={Style.MainContainer}>
          <Header params={"Register"}></Header>
          {
            errorMessage != null && (
              <View style={{
                flexDirection: 'row',
                  paddingTop: 10,
                  paddingBottom: 10,
              }}>
                <Text style={{
                  ...Style.messageText,
                  fontSize: BasicStyles.standardFontSize,
                  fontWeight: 'bold'
                }}>Oops! </Text>
                <Text style={{
                  ...Style.messageText,
                  fontSize: BasicStyles.standardFontSize
                }}>{errorMessage}</Text>
              </View>
            )
          }
          
          
          <View style={Style.TextContainer}>
            <TextInput
                style={{
                  ...BasicStyles.standardFormControl,
                  marginBottom: 20
                }}
                onChangeText={(firstName) => this.setState({firstName})}
                value={this.state.firstName}
                placeholder={'First Name'}
              />
              <TextInput
                style={{
                  ...BasicStyles.standardFormControl,
                  marginBottom: 20
                }}
                onChangeText={(lastName) => this.setState({lastName})}
                value={this.state.lastName}
                placeholder={'Last Name'}
              />
            <TextInput
              style={{
                ...BasicStyles.standardFormControl,
                marginBottom: 20
              }}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
              placeholder={'Username'}
            />
            
            <TextInput
              style={{
                ...BasicStyles.standardFormControl,
                marginBottom: 20
              }}
              onChangeText={(email) => this.setState({email})}
              value={this.state.email}
              placeholder={'Email Address'}
              keyboardType={'email-address'}
            />
            <View style={{
              marginBottom: 20
            }}>
              <PasswordWithIcon onTyping={(input) => this.setState({
                password: input
              })}
              placeholder={'Password'}/>
            </View>

            <View style={{
              // marginTop: 20,
              marginBottom: 20
            }}>
              <PasswordWithIcon onTyping={(input) => this.setState({
                confirmPassword: input
              })}
              placeholder={'Confirm Password'}
              />
            </View>

            <Button
              onClick={() => this.submit()}
              title={'Register'}
              // textStyle={{color:'black'}}
              style={{
                backgroundColor: theme ? theme.secondary : Color.secondary,
                width: '100%',
                marginBottom: 20,
                borderRadius: BasicStyles.standardBorderRadius,
                ...BasicStyles.standardShadow,
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
              }}>Have an account Already?</Text>
            </View>

            <Button
              onClick={() => this.redirect('loginStack')}
              title={'Login Now!'}
              textStyle={{color:'black'}}
              style={{
                backgroundColor: theme ? theme.primary : Color.primary,
                width: '100%',
                marginBottom: 100,
                borderRadius: BasicStyles.standardBorderRadius,
                ...BasicStyles.standardShadow,
              }}
            />

          </View>
        </View>

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
    logout: () => dispatch(actions.logout())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Register);
