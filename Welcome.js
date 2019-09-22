import React, { Component } from 'react';
import Style from './Style.js';
import { View, Image, Text} from 'react-native';
import { Routes, Color, Helper } from 'common';
class Welcome extends Component{
  constructor(props){
    super(props);
  }
  render() {
    return (
      <View style={Style.MainContainer}>
        <View style={Style.LogoContainer}>
          <Image source={require('assets/logo.png')} style={Style.LogoSize}/>
        </View>
        <View style={Style.TextContainer}>
          <Text>Welcome to {Helper.APP_NAME}</Text>
        </View>
      </View>
    );
  }
}
export default Welcome;