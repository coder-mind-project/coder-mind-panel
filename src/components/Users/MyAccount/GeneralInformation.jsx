import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { userType } from '@/types';
import {
  MenuItem,
  Grid,
  Icon,
  Tooltip,
  Box,
  CircularProgress,
  InputAdornment,
  Typography,
  Button,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import { cpfMask, celphoneMask } from '@/config/masks';

import CustomButton from '@/components/Buttons/Button.jsx';

import axios from 'axios';
import { backendUrl, defineErrorMsg } from '@/config/backend';

import { connect } from 'react-redux';
import { setUser as storeUser } from '@/redux/user/userActions';
import { bindActionCreators } from 'redux';

import { callToast as toastEmitter } from '@/redux/toast/toastActions';
import { success, error, info } from '@/config/toasts';

import InputFileButton from '@/components/InputFiles.jsx';

import DialogRemoveImage from './DialogRemoveImage';

import {
  ImageButton,
  CustomTextField,
  CustomKeyboardDatePicker,
} from './styles';


function GeneralInformation(props) {
  const {
    user,
    callToast,
    setUser,
  } = props;

  const [userState, setUserState] = useState({});
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailHelper, setEmailHelper] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [cancelingChangeEmail, setCancelingChangeEmail] = useState(false);
  const [showRemoveImg, setShowRemoveImg] = useState(false);

  function handleChange(evt, attr) {
    const { value } = evt.target;
    setUserState({ ...user, [attr]: value });
  }

  function handleChangeMaskData(evt, attr) {
    if (typeof attr !== 'string') return;
    const { value } = evt.target;
    switch (attr) {
      case 'cpf': {
        setUserState({ ...user, [attr]: cpfMask(value) });
        break;
      }
      default: {
        setUserState({ ...user, [attr]: celphoneMask(value) });
        break;
      }
    }
  }

  function handleDate(date) {
    setUserState({ ...user, birthDate: date });
  }

  async function formatData() {
    const data = { ...userState };

    if (user.email !== data.email) {
      data.confirmEmail = data.email;
      delete data.email;
    }
    return data;
  }

  async function save() {
    setSaving(true);

    const url = `${backendUrl}/users/${user._id}`;

    const data = await formatData();

    await axios.put(url, data).then((res) => {
      callToast(success('Informações salvas com sucesso'));
      if (res.data.confirmEmail) {
        setUserState({
          ...userState,
          confirmEmail: res.data.confirmEmail,
          confirmEmailToken: res.data.confirmEmailToken,
        });
      }

      const updatedUser = {
        user: {
          ...userState, profilePhoto: res.data,
        },
      };

      setUser(updatedUser);
    }).catch(async (err) => {
      const msg = defineErrorMsg(err);
      callToast(error(msg));
    });

    setSaving(false);
  }

  async function addPhoto(image) {
    // Only first image
    const img = image.target.files[0];
    if (!img) return callToast(info('Selecione uma imagem'));

    const id = user._id;

    const formData = new FormData();
    formData.append('profilePhoto', img);
    formData.append('idUser', id);

    // Overriding content-type https header for uploading images
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };

    const url = `${backendUrl}/users/img/${id}`;

    setSendingPhoto(true);

    await axios.patch(url, formData, config).then(async (res) => {
      callToast(success('Operação realizada com sucesso'));

      setUserState({ ...userState, profilePhoto: res.data });

      const updatedUser = {
        user: {
          ...user, profilePhoto: res.data,
        },
      };

      // Change user in global state (redux)
      setUser(updatedUser);
    }).catch((err) => {
      const msg = defineErrorMsg(err);
      callToast(error(msg));
    });

    setSendingPhoto(false);

    return null;
  }

  function showConfirmRemoveImage() {
    if (!userState.profilePhoto) return;
    setShowRemoveImg(true);
  }

  function hideConfirmRemoveImage(callback) {
    if (callback.removed) {
      const updatedUser = { ...user, profilePhoto: '' };

      setUserState(updatedUser);
      setUser({ user: updatedUser });
    }
    setShowRemoveImg(false);
  }

  function displayEmailHelpMessage() {
    if (user.confirmEmail) {
      setEmailHelper(true);
    }
  }

  function hideEmailHelpMessage() {
    setEmailHelper(false);
  }

  async function resendEmail() {
    if (resendingEmail) return;

    const id = user._id;
    const url = `${backendUrl}/users/emails/${id}`;

    setResendingEmail(true);

    await axios.post(url, userState).then((res) => {
      callToast(success(res.data));
    }).catch((err) => {
      const msg = defineErrorMsg(err);
      callToast(error(msg));
    });

    setResendingEmail(false);
  }

  async function cancelChangeEmail() {
    if (cancelingChangeEmail) return;

    const id = user._id;
    const url = `${backendUrl}/users/emails/${id}`;

    setCancelingChangeEmail(true);

    await axios.patch(url).then(() => {
      const updatedUser = userState;
      delete user.confirmEmail;
      setUserState({ updatedUser });
      callToast(success('Solicitação de alteração de e-mail removida com sucesso!'));
    }).catch((err) => {
      const msg = defineErrorMsg(err);
      callToast(error(msg));
    });

    setCancelingChangeEmail(false);
  }

  useEffect(() => {
    if (!userState._id) setUserState(user);
  }, [user, userState]);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        <DialogRemoveImage
          open={showRemoveImg}
          closeDialog={hideConfirmRemoveImage}
          user={user}
        />
        { user.confirmEmail
          && (
            <Box width="100%">
              <Alert severity="warning">
                <Typography component="p" variant="body2">
                  Existe uma confirmação de e-mail pendente para
                  {' '}
                  <strong>{user.confirmEmail}</strong>
                  , para trocar seu e-mail visite sua caixa de
                  entrada e clique no link para confirmar o novo e-mail.
                </Typography>
                <Box width="100%" display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" mt={2}>
                  <Button
                    onClick={resendEmail}
                    variant="outlined"
                    color="inherit"
                    size="small"
                  >
                    { resendingEmail ? 'Reenviando e-mail...' : 'Reenviar e-mail'}
                  </Button>
                  <Button
                    onClick={cancelChangeEmail}
                    variant="outlined"
                    color="inherit"
                    size="small"
                  >
                    { cancelingChangeEmail ? 'Cancelando...' : 'Cancelar alteração de e-mail'}
                  </Button>
                </Box>
              </Alert>
            </Box>
          )
        }
        <Grid item xs={12} md={3}>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Tooltip
              title={user.profilePhoto
                ? (
                  <Typography component="span" variant="body2">
                    Remover Imagem
                  </Typography>
                ) : ''}
              placement="top"
            >
              <Box>
                { !sendingPhoto
                  && (
                    <ImageButton
                      haveImg={Boolean(user.profilePhoto)}
                      size={150}
                      round
                      name={user.name}
                      src={userState.profilePhoto ? `${backendUrl}/${userState.profilePhoto}` : null}
                      alt="Foto de perfil"
                      onClick={showConfirmRemoveImage}
                    />
                  )}
                { sendingPhoto
                  && (
                    <Box mt={1} mb={2}>
                      <CircularProgress color="primary" />
                    </Box>
                  )}
              </Box>
            </Tooltip>
            <Box mt={2} mb={2}>
              <InputFileButton onChange={addPhoto} name="profilePhoto">
                <Button size="small" color="primary" variant="contained">
                  {user.profilePhoto ? 'Alterar imagem' : 'Adicionar imagem'}
                </Button>
              </InputFileButton>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          <Box width="100%" alignItems="center">
            <CustomTextField
              label="E-mail"
              value={userState.email || ''}
              onFocus={displayEmailHelpMessage}
              onBlur={hideEmailHelpMessage}
              fullWidth
              InputProps={userState.confirmEmail ? {
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon fontSize="small" color="primary">
                      warning
                    </Icon>
                  </InputAdornment>
                ),
              } : {}}
              helperText={emailHelper ? 'Existe uma confirmação de e-mail pendente, caso não seja o e-mail desejado informe um novo e salve, depois basta olhar sua caixa de entrada' : ''}
              onChange={(evt) => handleChange(evt, 'email')}
            />
          </Box>
          <CustomTextField
            label="Nome"
            inputProps={{ maxLength: 50 }}
            value={userState.name || ''}
            onChange={(evt) => handleChange(evt, 'name')}
          />
          <CustomTextField
            label="Genero"
            value={userState.gender || ''}
            select
            onChange={(evt) => handleChange(evt, 'gender')}
          >
            <MenuItem key="male" value="male">
              Masculino
            </MenuItem>
            <MenuItem key="female" value="female">
              Feminino
            </MenuItem>
            <MenuItem key="undefined" value="undefined">
              Prefere não informar
            </MenuItem>
          </CustomTextField>
          <CustomTextField
            label="Número de celular"
            placeholder="Ex: (11) 12355-5321"
            value={userState.cellphone || ''}
            onChange={(evt) => handleChangeMaskData(evt, 'cellphone')}
            inputProps={{ maxLength: 15 }}
          />
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <CustomKeyboardDatePicker
              label="Data de nascimento"
              clearable
              cancelLabel="Cancelar"
              clearLabel="Limpar"
              value={userState.birthDate}
              onChange={handleDate}
              mask="__/__/____"
              maxDate={new Date()}
              maxDateMessage="Data acima do permitido"
              minDateMessage="Data abaixo do permitido"
            />
          </MuiPickersUtilsProvider>
          <CustomTextField
            label="Endereço"
            value={userState.address || ''}
            onChange={(evt) => handleChange(evt, 'address')}
          />
          <CustomTextField
            label="Número"
            type="number"
            value={userState.number || ''}
            onChange={(evt) => handleChange(evt, 'number')}
          />
        </Grid>
      </Box>

      <Box width="100%" display="flex" alignItems="center" justifyContent="flex-end">
        <CustomButton
          color="primary"
          icon="done"
          iconSize="small"
          text={saving ? 'Salvando...' : 'Salvar'}
          onClick={save}
          loading={saving}
        />
      </Box>
    </Box>
  );
}

GeneralInformation.propTypes = {
  user: userType.isRequired,
  callToast: PropTypes.func.isRequired,
  setUser: PropTypes.func.isRequired,
};

const mapStateToProps = (state) =>
  ({
    user: state.user,
    toast: state.config,
  });

const mapDispatchToProps = (dispatch) =>
  bindActionCreators({
    setUser: storeUser,
    callToast: toastEmitter,
  },
  dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(GeneralInformation);
