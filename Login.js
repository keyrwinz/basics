import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView} from 'react-native';
import Style from './Style.js';
import { Spinner } from 'components';
import Api from 'services/api/index.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import Header from './Header';
import config from 'src/config';
class Login extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      username: null,
      password: null,
      isLoading: false,
      token: null,
      error: 0
    };
  }
  
  componentDidMount(){
    this.getData();
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

  retrieveUserData = (accountId) => {
    const { setNotifications, setMessenger } = this.props;
    let parameter = {
      account_id: accountId
    }
    Api.request(Routes.notificationsRetrieve, parameter, notifications => {
      setNotifications(notifications.size, notifications.data)
      Api.request(Routes.messagesRetrieve, parameter, messages => {
        setMessenger(messages.total_unread_messages, messages.data)
        this.setState({isLoading: false});
        this.props.navigation.navigate('drawerStack');
      });
    });
  }

  login = () => {
    this.test();
    const { login } = this.props;
    if(this.state.token != null){
      this.setState({isLoading: true});
      Api.getAuthUser(this.state.token, (response) => {
        login(response, this.state.token);
        let parameter = {
          condition: [{
            value: response.id,
            clause: '=',
            column: 'id'
          }]
        }
        Api.request(Routes.accountRetrieve, parameter, userInfo => {
          if(userInfo.data.length > 0){
            login(userInfo.data[0], this.state.token);
            this.retrieveUserData(userInfo.data[0].id)
          }else{
            this.setState({isLoading: false});
            login(null, null)
          }
        });
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
          Api.getAuthUser(response.token, (response) => {
            login(response, token);
            let parameter = {
              condition: [{
                value: response.id,
                clause: '=',
                column: 'id'
              }]
            }
            Api.request(Routes.accountRetrieve, parameter, userInfo => {
              if(userInfo.data.length > 0){
                login(userInfo.data[0], token);
                this.retrieveUserData(userInfo.data[0].id)
              }else{
                this.setState({isLoading: false});
                this.setState({error: 2})
              }
            });
            
          })
        }
      })
      // this.props.navigation.navigate('drawerStack');
    }else{
      this.setState({error: 1});
    }
  }

  render() {
    const { isLoading, error } = this.state;
    return (
      <ScrollView style={Style.ScrollView}>
        <View style={Style.MainContainer}>
          <Header params={"Login"}></Header>

          {error > 0 ? <View style={Style.messageContainer}>
            {error == 1 ? (
              <Text style={Style.messageText}>Please fill up the required fields.</Text>
            ) : null}

            {error == 2 ? (
              <Text style={Style.messageText}>Username and password didn't matched.</Text>
            ) : null}
          </View> : null}
          
          <View style={Style.TextContainer}>
            <TextInput
              style={BasicStyles.formControl}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
              placeholder={'Username or Email'}
            />
            <TextInput
              style={BasicStyles.formControl}
              onChangeText={(password) => this.setState({password})}
              value={this.state.password}
              placeholder={'********'}
              secureTextEntry={true}
            />
            <TouchableHighlight
              style={[BasicStyles.btn, BasicStyles.btnPrimary]}
              onPress={() => this.submit()}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Login
              </Text>
            </TouchableHighlight>

            
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
              style={[BasicStyles.btn, BasicStyles.btnSecondary]}
              onPress={() => this.redirect('registerStack')}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Register Now!
              </Text>
            </TouchableHighlight>
          </View>
        </View>

        {isLoading ? <Spinner mode="overlay"/> : null }
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
    setNotifications: (unread, notifications) => dispatch(actions.setNotifications(unread, notifications)),
    setMessenger: (unread, messages) => dispatch(actions.setMessenger(unread, messages))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
