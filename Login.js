import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView} from 'react-native';
import Style from './Style.js';
import { Spinner } from 'components';
import { Api } from 'services';
import { Routes, Color, Helper } from 'common';
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
          this.setState({isLoading: false});
          if(userInfo.data.length > 0){
            login(userInfo.data[0], this.state.token);
            this.props.navigation.navigate('drawerStack');
          }else{
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
              this.setState({isLoading: false});
              if(userInfo.data.length > 0){
                login(userInfo.data[0], token);
                this.props.navigation.navigate('drawerStack');
              }else{
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
          <View style={Style.LogoContainer}>
            <Image source={require('assets/logo.png')} style={Style.LogoSize}/>
          </View>

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
              style={Style.textInput}
              onChangeText={(username) => this.setState({username})}
              value={this.state.username}
              placeholder={'Username or Email'}
            />
            <TextInput
              style={Style.textInput}
              onChangeText={(password) => this.setState({password})}
              value={this.state.password}
              placeholder={'********'}
              secureTextEntry={true}
            />
            <TouchableHighlight
              style={Style.btnPrimary}
              onPress={() => this.submit()}
              underlayColor={Color.gray}>
              <Text style={Style.btnText}>
                Login
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
    logout: () => dispatch(actions.logout())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
