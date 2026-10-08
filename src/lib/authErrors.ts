export const passwordRequirements = 'Use no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.'
export const validPassword = (password: string) => password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^\w\s]|_/.test(password) && !/^\s|\s$/.test(password)
export function authError(error: unknown) {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  const messages: Record<string, string> = {
    OAuthNotConfigureException: 'O login com Google ainda não está configurado. Use e-mail e senha ou tente mais tarde.',
    AuthTokenConfigException: 'Não foi possível iniciar o acesso. Tente novamente mais tarde.',
    InvalidOriginException: 'Abra o StreakFlow pelo endereço oficial para entrar com Google.',
    InvalidRedirectException: 'O endereço de retorno do login não está disponível. Tente pelo endereço oficial.',
    OAuthRedirectFailure: 'Não foi possível concluir o login com Google. Tente novamente ou use e-mail e senha.',
    OAuthSignOutException: 'Não foi possível concluir a saída do Cognito. Tente novamente.',
    ProfileAttributeNotAllowed: 'Não foi possível alterar esse dado do perfil. Entre em contato com o suporte. Você pode continuar usando sua conta.',
    NotAuthorizedException: 'E-mail ou senha incorretos, ou sessão expirada. Tente entrar novamente.',
    UserNotFoundException: 'Não foi possível acessar essa conta. Confira o e-mail informado.',
    UserNotConfirmedException: 'Confirme seu e-mail antes de entrar.',
    UsernameExistsException: 'Já existe uma conta com este e-mail. Entre ou recupere sua senha.',
    CodeMismatchException: 'Código incorreto. Confira o código recebido por e-mail.',
    ExpiredCodeException: 'O código expirou. Solicite um novo código.',
    LimitExceededException: 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
    TooManyRequestsException: 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.',
    InvalidPasswordException: passwordRequirements,
    NetworkError: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
    UserAlreadyAuthenticatedException: 'Já existe uma sessão. Atualize a página para continuar.',
    InvalidParameterException: 'Confira os dados informados e tente novamente.',
  }
  return messages[name] ?? 'Não foi possível concluir a solicitação. Tente novamente.'
}
export function returnDestination(from: unknown) {
  return typeof from === 'string' && /^\/(?:dashboard(?:\/[^?#\\]*)?|meus-habitos\/?|historico\/?|progresso\/?)(?:[?#][^\\]*)?$/.test(from) ? from : '/dashboard'
}
