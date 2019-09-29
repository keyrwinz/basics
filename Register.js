import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput , Image, TouchableHighlight, Text, ScrollView} from 'react-native';
import Style from './Style.js';
import { Spinner } from 'components';
import { Api } from 'services';
import { Routes, Color, Helper, BasicStyles } from 'common';
import Header from './Header';
import config from 'src/config';
class Register extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      username: null,
      email: null,
      password: null,
      confirmPassword: null,
      isLoading: false,
      token: null,
      error: 0
    };
  }
  
  componentDidMount(){
  }


  redirect = (route) => {
    this.props.navigation.navigate(route);
  }
  
  submit(){
    const { username, email, password, confirmPassword } = this.state;
  }

  render() {
    const { isLoading, error } = this.state;
    return (
      <ScrollView style={Style.ScrollView}>
        <View style={Style.MainContainer}>
          <Header params={"Register"}></Header>

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
              placeholder={'Username'}
            />
            
            <TextInput
              style={BasicStyles.formControl}
              onChangeText={(email) => this.setState({email})}
              value={this.state.username}
              placeholder={'Email Address'}
            />
            <TextInput
              style={BasicStyles.formControl}
              onChangeText={(password) => this.setState({password})}
              value={this.state.password}
              placeholder={'********'}
              secureTextEntry={true}
            />
            
            <TextInput
              style={BasicStyles.formControl}
              onChangeText={(confirmPassword) => this.setState({confirmPassword})}
              value={this.state.password}
              placeholder={'********'}
              secureTextEntry={true}
            />
            <TouchableHighlight
              style={[BasicStyles.btn, BasicStyles.btnPrimary]}
              onPress={() => this.submit()}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Register
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
              }}>Have an account Already?</Text>
            </View>
            <TouchableHighlight
              style={[BasicStyles.btn, BasicStyles.btnSecondary]}
              onPress={() => this.redirect('loginStack')}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Login Now!
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
)(Register);
