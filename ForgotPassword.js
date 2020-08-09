import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView} from 'react-native';
import Style from './Style.js';
import { Spinner } from 'components';
import Api from 'services/api/index.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import CustomError from 'components/Modal/Error.js';
import Header from './Header';
import config from 'src/config';
import OtpModal from 'components/Modal/Otp.js';
class ForgotPassword extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      email: null,
      isLoading: false,
      token: null,
      errorMessage: null,
      changeStep: 0,
      password: null,
      confirmPassword: null,
      isOtpModal: false,
      blockedFlag: false,
      isResponseError: false,
      responseErrorTitle: null,
      responseErrorMessage: null,
      successMessage: null
    };
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }

  requestReset = () => {
    const { email } = this.state;
    if(email === null){
      this.setState({errorMessage: 'Email address is required.'})
      return false
    }
    if(Helper.validateEmail(email) === false){
      this.setState({errorMessage: 'You have entered an invalid email address.'})
      return false
    }
    let parameter = {
      email: email
    }
    Api.request(config.IS_DEV + '/accounts/request_reset', parameter, userInfo => {
      this.setState({
        successMessage: 'Successfully sent! Please check your e-mail address to continue.',
        errorMessage: null
      })
    }, error => {
      //
    })
  }
  
  updateOtp = () => {
    const { email } = this.state;
    const { login } = this.props;
    let parameter = {
      condition: [{
        value: email,
        clause: '=',
        column: 'email'
      }]
    }
    this.setState({isLoading: true})
    Api.request(Routes.accountRetrieve, parameter, userInfo => {
      console.log('userInfo', userInfo);
      this.setState({responseErrorTitle: null})
      this.setState({responseErrorMessage: null})
      this.setState({isResponseError: false})
      if(userInfo.data.length > 0){
        let otpParameter = {
          account_id: userInfo.data[0].id
        }
        login(userInfo.data[0], null);
        this.setState({responseErrorTitle: null})
        this.setState({responseErrorMessage: null})
        this.setState({isResponseError: false})
        Api.request(Routes.notificationSettingOtp, otpParameter, response => {
          console.log('otp', response)
          this.setState({otpData: response})
          this.setState({isLoading: false})
          if(response.error == null){
            this.setState({blockedFlag: false, errorMessage: null})
          }else{
            this.setState({blockedFlag: true})
            this.setState({errorMessage: response.error})
          }
          setTimeout(() => {
            this.setState({isOtpModal: true})
          }, 500)
        }, error => {
          console.log('error', error)
          this.setState({isResponseError: true})
        })
      }else{
        this.setState({isLoading: false})
        this.setState({responseErrorTitle: 'Error!'})
        this.setState({responseErrorMessage: 'Email address not found!'})
        this.setState({isResponseError: true})
      }
    }, error => {
      this.setState({isResponseError: true})
    })
    
  }

  submit(){
    this.updateOtp()
  }

  resetPassword = () => {
    const { password, confirmPassword } = this.state;
    if(password == null || password == '' || confirmPassword == null || confirmPassword == ''){
      this.setState({errorMessage: 'Please fill up the required fields.'})
      return false
    }
    if(password.length < 6){
       this.setState({errorMessage: 'Password must be atleast 6 characters.'})
       return false
    }
    if(password.localeCompare(confirmPassword) !== 0){
      this.setState({errorMessage: 'Password did not match.'})
      return false
    }
    this.setState({isLoading: true})
    const { user } = this.props.state;
    let parameter = {
      username: user.username,
      code: user.code,
      password: this.state.password
    }
    console.log('parameter', parameter);
    this.setState({isResponseError: false})
    Api.request(Routes.accountUpdate, parameter, response => {
      this.setState({isLoading: false})
      this.props.navigation.navigate('loginStack')
    }, error => {
      console.log(error)
      this.setState({isLoading: false})
      this.setState({isResponseError: true})
    })
  }

  _changePassword = () => {
    const { theme } = this.props.state;
    return (
      <View>
        <TextInput
          style={BasicStyles.formControl}
          onChangeText={(password) => this.setState({password})}
          value={this.state.password}
          placeholder={'New password'}
          secureTextEntry={true}
        />

        <TextInput
          style={BasicStyles.formControl}
          onChangeText={(confirmPassword) => this.setState({confirmPassword})}
          value={this.state.confirmPassword}
          placeholder={'Confirm new password'}
          secureTextEntry={true}
        />

        <TouchableHighlight
          style={[BasicStyles.btn, {
            backgroundColor: theme ? theme.primary : Color.primary
          }]}
          onPress={() => this.resetPassword()}
          underlayColor={Color.gray}>
          <Text style={BasicStyles.textWhite}>
            Reset
          </Text>
        </TouchableHighlight>
      </View>
    );    
  }

  _sendRequest = () => {
    const { theme } = this.props.state;
    return (
      <View>
        <TextInput
          style={BasicStyles.formControl}
          onChangeText={(email) => this.setState({email})}
          value={this.state.email}
          placeholder={'Email Address'}
          keyboardType={'email-address'}
        />

        <TouchableHighlight
          style={[BasicStyles.btn, {
            backgroundColor: theme ? theme.primary : Color.primary
          }]}
          onPress={() => this.requestReset()}
          underlayColor={Color.gray}>
          <Text style={BasicStyles.textWhite}>
            Request change
          </Text>
        </TouchableHighlight>
      </View>
    );
  }
  render() {
    const { isLoading, errorMessage, changeStep, successMessage } = this.state;
    const { theme } = this.props.state;
    const { blockedFlag, isOtpModal, isResponseError, responseErrorTitle, responseErrorMessage  } = this.state;
    return (
      <ScrollView style={Style.ScrollView}>
        <View style={Style.MainContainer}>
          <Header params={"Request change password"}></Header>
          {
            errorMessage != null && (
              <View style={{
                flexDirection: 'row',
                  paddingTop: 10,
                  paddingBottom: 10,
              }}>
                <Text style={[Style.messageText, {
                  fontWeight: 'bold'
                }]}>Oops! </Text>
                <Text style={Style.messageText}>{errorMessage}</Text>
              </View>
            )
          }
          {
            successMessage != null && (
              <View style={{
                flexDirection: 'row',
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 10,
                  paddingRight: 10
              }}>
                <Text style={[Style.messageText, {
                  color: Color.black
                }]}>{successMessage}</Text>
              </View>
            )
          }
          
          <View style={Style.TextContainer}>
            { changeStep == 0 && (this._sendRequest()) }
            { changeStep == 1 && (this._changePassword()) }
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
            <TouchableHighlight
              style={[BasicStyles.btn, {
                backgroundColor: theme ? theme.secondary : Color.secondary
              }]}
              onPress={() => this.redirect('loginStack')}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Login Now!
              </Text>
            </TouchableHighlight>
          </View>
        </View>
        <OtpModal
          visible={isOtpModal}
          title={blockedFlag == false ? 'Authentication via OTP' : 'Blocked Account'}
          actionLabel={{
            yes: 'Authenticate',
            no: 'Cancel'
          }}
          onCancel={() => this.setState({changeStep: 0, isOtpModal: false})}
          onSuccess={() => this.setState({changeStep: 1, isOtpModal: false})}
          onResend={() => this.updateOtp()}
          error={errorMessage}
          blockedFlag={blockedFlag}
        ></OtpModal>

        {isLoading ? <Spinner mode="overlay"/> : null }
        {isResponseError ? <CustomError visible={isResponseError} onCLose={() => {
          this.setState({isResponseError: false, isLoading: false})
        }}
          title={responseErrorTitle}
          message={responseErrorMessage}
        /> : null}
      </ScrollView>
    );
  }
}
 
const mapStateToProps = state => ({ state: state });

const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    login: (user, token) => dispatch(actions.login(user, token))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ForgotPassword);
