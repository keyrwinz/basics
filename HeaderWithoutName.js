import React, { Component } from 'react';
import { View , Image, Text} from 'react-native';
import Style from './Style';
import {Helper} from 'common';
export default  class Header extends Component{
  render(){
    return (
      <View>
        <View style={Style.LogoContainer}>
          <Image source={require('assets/logo.png')} style={Style.LogoSize}/>
        </View>
      </View>
    );
  }
}