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
class ForgotPassword extends Component {
  //Screen1 Component
  constructor(props){
    super(props);
    this.state = {
      username: null,
      isLoading: false,
      token: null,
      error: 0
    };
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }
  
  submit(){
    const { username } = this.state;
  }

  render() {
    const { isLoading, error } = this.state;
    return (
      <ScrollView style={Style.ScrollView}>
        <View style={Style.MainContainer}>
          <Header params={"Request"}></Header>

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
              placeholder={'Type Username or Email Address'}
            />

            <TouchableHighlight
              style={[BasicStyles.btn, BasicStyles.btnPrimary]}
              onPress={() => this.submit()}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Send a request
              </Text>
            </TouchableHighlight>
            
            <TouchableHighlight
              style={[BasicStyles.btn, BasicStyles.btnSecondary]}
              onPress={() => this.redirect('loginStack')}
              underlayColor={Color.gray}>
              <Text style={BasicStyles.textWhite}>
                Back
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
)(ForgotPassword);
