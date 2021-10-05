import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView, Dimensions} from 'react-native';
import Style from './../Style.js';
import { Spinner } from 'components';
import Api from 'services/api/index.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import CustomError from 'components/Modal/Error.js';
import PasswordWithIcon from 'components/InputField/Password.js';
import Header from './../HeaderWithoutName';
import config from 'src/config';
import Button from 'components/Form/Button';
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
      confirmPassword: '',
      isLoading: false,
      token: null,
      error: 0,
      errorMessage: null,
      isResponseError: false,
      referral_code: null
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
      status: 'ADMIN'
    }
    console.log('[parameter]', parameter)
    this.setState({isLoading: true})
    Api.request(Routes.accountCreate, parameter, response => {
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

  validate(){
    const { username, email, password, confirmPassword } = this.state;
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
    }else{ 
      this.setState({errorMessage: 'Please fill in all required fields.'})
      return false
    }
  }

  render() {
    const { isLoading, errorMessage, isResponseError } = this.state;
    const { theme } = this.props.state;
    return (
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
                  
                  <TextInput
                    style={{
                      ...BasicStyles.standardFormControl,
                      marginBottom: 20
                    }}
                    onChangeText={(email) => this.setState({email})}
                    value={this.state.email}
                    placeholder={'Email Address'}
                    keyboardType={'email-address'}
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
                  <TextInput
                    style={{
                      ...BasicStyles.standardFormControl,
                      marginBottom: 20
                    }}
                    onChangeText={(referral_code) => this.setState({referral_code})}
                    value={this.state.referral_code}
                    placeholder={'Enter Referral Code (Optional)'}
                    placeholderTextColor={Color.darkGray}
                  />

                  <Button
                    onClick={() => this.submit()}
                    title={'Register'}
                    style={{
                      backgroundColor: theme ? theme.secondary : Color.secondary,
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
                    }}>Have an account Already?</Text>
                  </View>

                  <Button
                    onClick={() => this.redirect('loginStack')}
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
