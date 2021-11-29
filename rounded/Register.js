import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, View , TextInput , Image, TouchableHighlight, Text, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView} from 'react-native';
import Style from './../Style.js';
import { Platform } from 'react-native';
import { Spinner } from 'components';
import Api from 'services/api/index.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import CustomError from 'components/Modal/Error.js';
import PasswordWithIcon from 'components/InputField/Password.js';
import Header from './../HeaderWithoutName';
import Button from 'components/Form/Button';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import { faCheck, faEdit } from '@fortawesome/free-solid-svg-icons';
const width = Math.round(Dimensions.get('window').width);
const height = Math.round(Dimensions.get('window').height);

class Register extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      username: '',
      email: '',
      password: '',
      emailCode: null,
      confirmPassword: '',
      isLoading: false,
      token: null,
      error: 0,
      errorMessage: null,
      isResponseError: false,
      referral_code: null,
      continueFlag: false,
      getCodeFlag: false,
      isEmailLoading: false
    };
  }
  
  componentDidMount(){
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }
  
  submit(){
    const { username, email, password, referral_code } = this.state;
    if(this.validate() == false){
      return
    }
    let parameter = {
      username: username,
      email: email,
      password: password,
      config: null,
      account_type: 'USER',
      referral_code: referral_code,
      status: 'ADMIN',
      account_status: 'EMAIL_VERIFIED'
    }
    this.setState({isLoading: true})
    Api.request(Routes.accountCreate, parameter, response => {
      console.log('[register]', response)
      this.setState({isLoading: false})
      if(response.error !== null){
        if(response.error.status === 100){
          let message = response.error.message
          if(typeof message.username !== undefined && typeof message.username !== 'undefined'){
            this.setState({errorMessage: message.username[0]})
          }else if(typeof message.email !== undefined && typeof message.email !== 'undefined'){
            this.setState({errorMessage: message.email[0]})
          }
        }else if(response.data !== null){
          if(response.data > 0){
            this.redirect('loginStack')
          }
        }
      }
    }, error => {
      this.setState({isResponseError: true})
    })
  }

  getEmailCode(){
    const { email } = this.state;
    this.setState({
      getCodeFlag: false
    })
    if(email == null || email == ''){
      this.setState({errorMessage: 'Email address is required.'})
      return false
    }else if(email !== '' && Helper.validateEmail(email) === false){
      this.setState({errorMessage: 'You have entered an invalid email address.'})
      return false
    }
    let parameter = {
      email: email
    }
    this.setState({
      isEmailLoading: true
    })
    Api.request(Routes.preVerify, parameter, response => {
      console.log('[>>>>>>>>>>>]', response)
      if(response.data == null && response.error  != null){
        this.setState({
          errorMessage: response.error
        })
      }else{
        this.setState({errorMessage: null, getCodeFlag: true})
        Alert.alert(
          "Email Code Notification",
          "We sent a code to your email address specified.",
          [
            {
              text: "Ok", onPress: () => {
              }
            }
          ]
        );
      }
      this.setState({
        isEmailLoading: false
      })
    }, error => {
      this.setState({
        isEmailLoading: false
      })
    })
  }

  verifyCode(code){
    this.setState({emailCode: code})
    if(code && code.length == 6){
      // verify here
      const { email } = this.state;
      let parameter = {
        condition: [{
          value: code,
          column: 'category',
          clause: '='
        }, {
          value: email,
          column: 'payload_value',
          clause: '='
        }, {
          value: 'pre_register',
          column: 'payload',
          clause: '='
        }]
      }
      this.setState({
        isLoading: true
      })
      Api.request(Routes.payloadRetrieve, parameter, response => {
        this.setState({
          isLoading: false
        })
        if(response.data && response.data.length > 0){
          this.setState({
            continueFlag: true
          })
        }else{
          this.setState({
            continueFlag: false
          })
        }
      }, error => {
        this.setState({
          isLoading: false
        })
      })
    }
  }

  validate(){
    const { username, email, password, confirmPassword,continueFlag } = this.state;
    if(username.length >= 6 &&
      email !== '' &&
      username.includes(' ') === false &&
      Helper.validatePassword(password) === true &&
      password.localeCompare(confirmPassword) === 0 &&
      Helper.validateEmail(email) === true){
      return true
    }else if(username.includes(' ')){
      this.setState({errorMessage: 'Spaces in username is not allowed'})
      return false
    }else if(email !== '' && Helper.validateEmail(email) === false){
      this.setState({errorMessage: 'You have entered an invalid email address.'})
      return false
    }else if(username !== '' && username.length < 6){
      this.setState({errorMessage: 'Username must be atleast 6 characters.'})
      return false
    }else if(Helper.validatePassword(password) === false){
      this.setState({errorMessage: 'Passwords should be atleast 6 characters. It must be alphanumeric characters. It should contain 1 number, 1 special character and 1 capital letter.'})
      return false
    }else if(password !== '' && password.localeCompare(confirmPassword) !== 0){
      this.setState({errorMessage: 'Password did not match.'})
      return false
    }else if(continueFlag == false){
      this.setState({
        errorMessage: 'Email address is not verified.'
      })
      return false
    }else{ 
      this.setState({errorMessage: 'Please fill in all required fields.'})
      return false
    }
  }

  render() {
    const { isLoading, errorMessage, isResponseError, continueFlag, getCodeFlag, isEmailLoading } = this.state;
    const { theme } = this.props.state;
    return (
      <KeyboardAvoidingView
        style = {{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : null}>
        <ScrollView style={{
          backgroundColor: theme ? theme.primary : Color.primary
        }}
        showsVerticalScrollIndicator={false}>
          <View style={{
            flex: 1
          }}>
            <Header params={"Request change password"}></Header>
              <View style={{
                backgroundColor: Color.white,
                width: '100%',
                height: height * 1.5,
                paddingTop: 50,
                marginTop: 10,
                borderTopLeftRadius: 60,
                borderTopRightRadius: 60,
                ...BasicStyles.loginShadow
              }}>
                <Text style={{
                  width: '100%',
                  textAlign: 'center',
                  paddingBottom: 20,
                  fontSize: BasicStyles.standardFontSize,
                  fontWeight: 'bold',
                  color: theme ? theme.primary : Color.primary
                }}>Register to {Helper.APP_NAME_BASIC}</Text>
                  {
                    errorMessage != null && (
                      <View style={{
                        flexDirection: 'row',
                          paddingTop: 10,
                          paddingBottom: 10
                      }}>
                        <Text style={{
                          ...Style.messageText,
                          fontSize: BasicStyles.standardFontSize,
                          width: '100%',
                          textAlign: 'center',
                          paddingLeft: 10,
                          paddingRight: 10,
                        }}>Oops! {errorMessage}</Text>
                      </View>
                    )
                  }
                  
                  
                  <View style={Style.TextContainerRounded}>
                    
                    
                    <View style={{
                      flexDirection: 'row',
                      width: '100%',
                      ...BasicStyles.standardFormControl,
                      marginBottom: 20
                    }}>
                      <TextInput
                        style={{
                          width: (continueFlag || isEmailLoading) ? '70%' : '100%'
                        }}
                        onChangeText={(email) => this.setState({email})}
                        value={this.state.email}
                        placeholder={'Email Address'}
                        keyboardType={'email-address'}
                        editable={!continueFlag}
                        placeholderTextColor={Color.darkGray}
                      />
                      {
                        continueFlag && (
                          <TouchableOpacity style={{
                            borderTopRightRadius: 25,
                            borderBottomRightRadius: 25,
                            width: '30%',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onPress={() => {
                            this.setState({
                              continueFlag: false,
                              emailCode: null
                            })
                          }}
                          >
                            <FontAwesomeIcon icon={faEdit} color={Color.danger}/>
                          </TouchableOpacity>
                        )
                      }
                      {
                        (isEmailLoading == true) && (
                          <TouchableOpacity style={{
                            borderTopRightRadius: 25,
                            borderBottomRightRadius: 25,
                            width: '30%',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onPress={() => {
                            this.setState({
                              continueFlag: false,
                              emailCode: null
                            })
                          }}
                          >
                            <ActivityIndicator size={20} color={Color.secondary} />
                          </TouchableOpacity>
                        )
                      }
                    </View>

                    <Button
                      onClick={() => {
                        this.getEmailCode()
                      }}
                      title={'Get Code'}
                      style={{
                        backgroundColor: Color.secondary,
                        width: '100%',
                        marginBottom: 25
                      }}
                    />


                {
                  (getCodeFlag == true) && (
                      <View
                        style={{
                        flexDirection: 'row',
                        width: '100%',
                        ...BasicStyles.standardFormControl,
                        marginBottom: 20
                      }}>
    
                        <TextInput
                          style={{
                            width: isLoading ? '70%' : '100%'
                          }}
                          onChangeText={(code) => {
                            this.verifyCode(code)
                          }}
                          value={this.state.emailCode}
                          placeholder={'Enter Code send from your email'}
                          placeholderTextColor={Color.darkGray}
                          editable={!continueFlag}
                        />
    
                        
    
                        <TouchableOpacity style={{
                          borderTopRightRadius: 25,
                          borderBottomRightRadius: 25,
                          width: '30%',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onPress={() => {
                          this.getEmailCode()
                        }}
                        >
                          {
                            (continueFlag == true && isLoading == false) && (
                              <FontAwesomeIcon icon={faCheck} color={Color.secondary}/>
                            )
                          }
    
                          {
                            (isLoading == true) && (
                              <ActivityIndicator size={20} color={Color.secondary} />
                            )
                          }
                          
                        </TouchableOpacity>
                      </View>
                    )
                  }
                    
                    
                    {
                      continueFlag == true && (
                        <View>
                          <TextInput
                            style={{
                              ...BasicStyles.standardFormControl,
                              marginBottom: 20
                            }}
                            onChangeText={(username) => this.setState({username})}
                            value={this.state.username}
                            placeholder={'Username'}
                            placeholderTextColor={Color.darkGray}
                          />

                          <PasswordWithIcon onTyping={(input) => this.setState({
                            password: input
                          })}
                          placeholder={'Password'}/>

                          <View style={{
                            marginTop: 20,
                            marginBottom: 20
                          }}>
                            <PasswordWithIcon onTyping={(input) => this.setState({
                              confirmPassword: input
                            })}
                            placeholder={'Confirm Password'}
                            />
                          </View>
                        
                        </View>
                        
                      )
                    }
                    
                    {/* <TextInput
                      style={{
                        ...BasicStyles.standardFormControl,
                        marginBottom: 20
                      }}
                      onChangeText={(referral_code) => this.setState({referral_code})}
                      value={this.state.referral_code}
                      placeholder={'Enter Referral Code (Optional)'}
                      placeholderTextColor={Color.darkGray}
                    /> */}

                    {
                      continueFlag && (
                        <Button
                          onClick={() => this.submit()}
                          title={'Register'}
                          style={{
                            backgroundColor: theme ? theme.secondary : Color.secondary,
                            width: '100%',
                            marginBottom: 20
                          }}
                        />
                      )
                    }

                    

                    <View style={{
                      height: 1,
                      backgroundColor: Color.gray,
                      marginTop: continueFlag == false ? 100 : 0
                    }}>
                    </View>

                    <View style={{
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{
                        paddingTop: 10,
                        paddingBottom: 10,
                        color: '#949699'
                      }}>Have an account already?</Text>
                    </View>

                    <Button
                      onClick={() => this.props.navigation.navigate('loginStack')}
                      title={'Login Now!'}
                      style={{
                        backgroundColor: Color.warning,
                        width: '100%',
                        marginBottom: 100
                      }}
                    />
                  </View>
              </View>
          </View>

          {isResponseError ? <CustomError visible={isResponseError} onCLose={() => {
            this.setState({isResponseError: false, isLoading: false})
          }}/> : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
