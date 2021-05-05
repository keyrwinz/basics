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
class Verify extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
        isResponseError: false,
        isLoading: false,
        errorMessage: null,
        user: null
    };
  }
  
  componentDidMount(){
    console.log('params', this.props.navigation.state)
    this.setState({isLoading: true})
    this.retrieve()
  }

  retrieve(){
    const { params } = this.props.navigation.state;
    console.log(params);
    if(params == null || (params && !params.code)){
      return
    }
    let username = params.username.replace('%20', ' ')
    let parameter = {
      condition: [{
        value: params.code,
        column: 'code',
        clause: '='
      }, {
        value: username,
        column: 'username',
        clause: '='
      }]
    }
    this.setState({isLoading: true})
    Api.request(Routes.accountRetrieve, parameter, response => {
      console.log('asdfasdf', response);
      this.setState({isLoading: false})
      if(response.data.length > 0){
        this.setState({
          user: response.data[0],
          errorMessage: null
        })
      }else{
        this.setState({
          user: null,
          errorMessage: 'Invalid accessed!'
        })
      }
    }, error => {
      this.setState({
        isLoading: false,
        user: null,
        errorMessage: null
      })
      this.retrieve()
    })
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }
  
  submit(){
    const { user } = this.state;
    if(user == null){
      this.setState({
        errorMessage: 'Invalid accessed!'
      })
      return
    }

    let parameter = {
      id: user.id,
      status: 'VERIFIED'
    }
    this.setState({isLoading: true})
    Api.request(Routes.accountVerification, parameter, response => {
      this.setState({isLoading: false})
      this.redirect('loginStack')
    }, error => {
      this.setState({isLoading: false})
    })
  }

  render() {
    const { isLoading, errorMessage, isResponseError, user } = this.state;
    const { theme } = this.props.state;
    return (
      <ScrollView style={{
        backgroundColor: theme ? theme.primary : Color.primary
      }}
      showsVerticalScrollIndicator={false}>
        <View style={{
          flex: 1
        }}>
          {isLoading ? <Spinner mode="overlay"/> : null }
          <Header params={"Verify Email"}></Header>
            <View style={{
              backgroundColor: Color.white,
              width: '100%',
              height: height,
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
              }}>Email Verification</Text>
              {
                errorMessage != null && (
                  <View style={{
                    flexDirection: 'row',
                      paddingTop: 10,
                      paddingBottom: 10,
                      paddingLeft: '20%'
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
                
              {
                (user && errorMessage == null) && (
                  <Text style={{
                    width: '100%',
                    textAlign: 'center',
                    paddingBottom: 20,
                    paddingLeft: 20,
                    paddingRight: 20,
                    fontSize: BasicStyles.standardFontSize,
                  }}>Hi {user?.username}! Please click the continue button to verify your email address here in {Helper.APP_NAME_BASIC}.</Text>
                )
              }
              
                
              <View style={Style.TextContainerRounded}>
                {
                  user && (
                    <Button
                      onClick={() => this.submit()}
                      title={'Continue'}
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
)(Verify);
