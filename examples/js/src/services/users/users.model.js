// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const users = sequelizeClient.define('users', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN
    },
    verifyToken: {
      type: DataTypes.STRING
    },
    verifyShortToken: {
      type: DataTypes.STRING
    },
    verifyExpires: {
      type: DataTypes.DATE
    },
    verifyChanges: {
      type: DataTypes.ARRAY(DataTypes.STRING)
    },
    resetToken: {
      type: DataTypes.STRING
    },
    resetShortToken: {
      type: DataTypes.STRING
    },
    resetExpires: {
      type: DataTypes.DATE
    },
    resetAttempts: {
      type: DataTypes.NUMBER
    },
    preferredComm: {
      type: DataTypes.STRING
    }
  }, {
    hooks: {
      beforeCount(options) {
        options.raw = true;
      }
    }
  });

  // eslint-disable-next-line no-unused-vars
  users.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return users;
};
