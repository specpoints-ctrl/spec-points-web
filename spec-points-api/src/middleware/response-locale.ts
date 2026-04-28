import { NextFunction, Request, Response } from 'express';

type Replacer = {
  pattern: RegExp;
  value: string | ((...args: string[]) => string);
};

const REPLACERS: Replacer[] = [
  { pattern: /NÃ£o autenticado|Não autenticado/gi, value: 'No autenticado' },
  { pattern: /UsuÃ¡rio nÃ£o encontrado|Usuário não encontrado/gi, value: 'Usuario no encontrado' },
  { pattern: /Perfil de usuÃ¡rio nÃ£o encontrado|Perfil de usuário não encontrado/gi, value: 'Perfil de usuario no encontrado' },
  { pattern: /Perfil de arquiteto nÃ£o encontrado|Perfil de arquiteto não encontrado/gi, value: 'Perfil de arquitecto no encontrado' },
  { pattern: /Arquiteto nÃ£o encontrado|Arquiteto não encontrado/gi, value: 'Arquitecto no encontrado' },
  { pattern: /Loja nÃ£o encontrada|Loja não encontrada|Loja nao encontrada/gi, value: 'Tienda no encontrada' },
  { pattern: /Campanha nÃ£o encontrada|Campanha não encontrada/gi, value: 'Campana no encontrada' },
  { pattern: /PrÃªmio nÃ£o encontrado|Prêmio não encontrado|Premio nao encontrado/gi, value: 'Premio no encontrado' },
  { pattern: /PrÃªmio nÃ£o estÃ¡ disponÃ­vel|Prêmio não está disponível/gi, value: 'Premio no disponible' },
  { pattern: /PrÃªmio sem estoque|Prêmio sem estoque/gi, value: 'Premio sin stock' },
  { pattern: /Resgate nÃ£o encontrado|Resgate não encontrado/gi, value: 'Canje no encontrado' },
  { pattern: /Venda nÃ£o encontrada|Venda não encontrada/gi, value: 'Venta no encontrada' },
  { pattern: /Acesso negado/gi, value: 'Acceso denegado' },
  { pattern: /Status invÃ¡lido|Status inválido|Status invalido/gi, value: 'Estado invalido' },
  { pattern: /Role invÃ¡lido para completar perfil|Role inválido para completar perfil/gi, value: 'Rol invalido para completar el perfil' },
  { pattern: /Email e senha sÃ£o obrigatÃ³rios|Email e senha são obrigatórios/gi, value: 'El correo y la contrasena son obligatorios' },
  { pattern: /Senha deve ter no mÃ­nimo 8 caracteres|Senha deve ter no mínimo 8 caracteres/gi, value: 'La contrasena debe tener al menos 8 caracteres' },
  { pattern: /Nome completo Ã© obrigatÃ³rio|Nome completo é obrigatório/gi, value: 'El nombre completo es obligatorio' },
  { pattern: /Nome da loja Ã© obrigatÃ³rio|Nome da loja é obrigatório/gi, value: 'El nombre de la tienda es obligatorio' },
  { pattern: /Email jÃ¡ estÃ¡ em uso|Email já está em uso/gi, value: 'El correo ya esta en uso' },
  { pattern: /Email Ã© obrigatÃ³rio|Email é obrigatório/gi, value: 'El correo es obligatorio' },
  { pattern: /Email invÃ¡lido|Email inválido/gi, value: 'Correo invalido' },
  { pattern: /Credenciais invÃ¡lidas|Credenciais inválidas/gi, value: 'Credenciales invalidas' },
  { pattern: /Conta bloqueada\. Entre em contato com o suporte\./gi, value: 'Cuenta bloqueada. Contacte al soporte.' },
  { pattern: /Conta aguardando aprovaÃ§Ã£o\.|Conta aguardando aprovação\./gi, value: 'Cuenta pendiente de aprobacion.' },
  { pattern: /Muitas tentativas de login\. Tente novamente em 15 minutos\./gi, value: 'Demasiados intentos de inicio de sesion. Intentalo de nuevo en 15 minutos.' },
  { pattern: /Erro ao realizar cadastro/gi, value: 'No se pudo completar el registro' },
  { pattern: /Erro ao listar arquitetos ativos/gi, value: 'No se pudo listar a los arquitectos activos' },
  { pattern: /Erro ao listar arquitetos/gi, value: 'No se pudieron listar los arquitectos' },
  { pattern: /Erro ao buscar arquiteto/gi, value: 'No se pudo obtener el arquitecto' },
  { pattern: /Erro ao criar arquiteto/gi, value: 'No se pudo crear el arquitecto' },
  { pattern: /Erro ao atualizar arquiteto/gi, value: 'No se pudo actualizar el arquitecto' },
  { pattern: /Erro ao deletar arquiteto/gi, value: 'No se pudo eliminar el arquitecto' },
  { pattern: /Erro ao atualizar status/gi, value: 'No se pudo actualizar el estado' },
  { pattern: /Erro ao processar login Google/gi, value: 'No se pudo procesar el acceso con Google' },
  { pattern: /Erro ao processar login/gi, value: 'No se pudo procesar el inicio de sesion' },
  { pattern: /Erro ao buscar usuÃ¡rio|Erro ao buscar usuário/gi, value: 'No se pudo obtener el usuario' },
  { pattern: /Erro ao completar perfil/gi, value: 'No se pudo completar el perfil' },
  { pattern: /Erro ao listar campanhas/gi, value: 'No se pudieron listar las campanas' },
  { pattern: /Erro ao buscar campanha/gi, value: 'No se pudo obtener la campana' },
  { pattern: /Erro ao criar campanha/gi, value: 'No se pudo crear la campana' },
  { pattern: /Erro ao atualizar campanha/gi, value: 'No se pudo actualizar la campana' },
  { pattern: /Erro ao deletar campanha/gi, value: 'No se pudo eliminar la campana' },
  { pattern: /Erro ao buscar ranking da campanha/gi, value: 'No se pudo obtener el ranking de la campana' },
  { pattern: /Erro ao buscar campanhas ativas/gi, value: 'No se pudieron obtener las campanas activas' },
  { pattern: /Erro ao buscar minhas campanhas/gi, value: 'No se pudieron obtener mis campanas' },
  { pattern: /Erro ao listar premios ativos/gi, value: 'No se pudieron listar los premios activos' },
  { pattern: /Erro ao listar premios/gi, value: 'No se pudieron listar los premios' },
  { pattern: /Erro ao buscar premio/gi, value: 'No se pudo obtener el premio' },
  { pattern: /Erro ao criar premio/gi, value: 'No se pudo crear el premio' },
  { pattern: /Erro ao atualizar premio/gi, value: 'No se pudo actualizar el premio' },
  { pattern: /Erro ao deletar premio/gi, value: 'No se pudo eliminar el premio' },
  { pattern: /Erro ao atualizar status do premio/gi, value: 'No se pudo actualizar el estado del premio' },
  { pattern: /Erro ao listar vendas/gi, value: 'No se pudieron listar las ventas' },
  { pattern: /Erro ao buscar venda/gi, value: 'No se pudo obtener la venta' },
  { pattern: /Erro ao criar venda/gi, value: 'No se pudo crear la venta' },
  { pattern: /Erro ao atualizar venda/gi, value: 'No se pudo actualizar la venta' },
  { pattern: /Erro ao deletar venda/gi, value: 'No se pudo eliminar la venta' },
  { pattern: /Erro ao listar resgates/gi, value: 'No se pudieron listar los canjes' },
  { pattern: /Erro ao buscar resgate/gi, value: 'No se pudo obtener el canje' },
  { pattern: /Erro ao criar resgate/gi, value: 'No se pudo crear el canje' },
  { pattern: /Erro ao solicitar resgate/gi, value: 'No se pudo solicitar el canje' },
  { pattern: /Erro ao buscar meus resgates/gi, value: 'No se pudieron obtener mis canjes' },
  { pattern: /Erro ao aprovar resgate/gi, value: 'No se pudo aprobar el canje' },
  { pattern: /Erro ao registrar entrega/gi, value: 'No se pudo registrar la entrega' },
  { pattern: /Erro ao atualizar resgate/gi, value: 'No se pudo actualizar el canje' },
  { pattern: /Erro ao deletar resgate/gi, value: 'No se pudo eliminar el canje' },
  { pattern: /Erro ao listar lojas/gi, value: 'No se pudieron listar las tiendas' },
  { pattern: /Erro ao buscar loja/gi, value: 'No se pudo obtener la tienda' },
  { pattern: /Erro ao criar loja/gi, value: 'No se pudo crear la tienda' },
  { pattern: /Erro ao atualizar loja/gi, value: 'No se pudo actualizar la tienda' },
  { pattern: /Erro ao deletar loja/gi, value: 'No se pudo eliminar la tienda' },
  { pattern: /Erro ao atualizar status da loja/gi, value: 'No se pudo actualizar el estado de la tienda' },
  { pattern: /Erro ao buscar termos/gi, value: 'No se pudieron obtener los terminos' },
  { pattern: /Erro ao listar termos/gi, value: 'No se pudieron listar los terminos' },
  { pattern: /Erro ao criar termos/gi, value: 'No se pudieron crear los terminos' },
  { pattern: /Erro ao atualizar termos/gi, value: 'No se pudieron actualizar los terminos' },
  { pattern: /Erro ao verificar aceite dos termos/gi, value: 'No se pudo verificar la aceptacion de terminos' },
  { pattern: /Erro ao aceitar termos/gi, value: 'No se pudieron aceptar los terminos' },
  { pattern: /Cadastro realizado com sucesso\. Aguardando aprovaÃ§Ã£o\.|Cadastro realizado com sucesso\. Aguardando aprovação\./gi, value: 'Registro completado con exito. Pendiente de aprobacion.' },
  { pattern: /Perfil atualizado com sucesso/gi, value: 'Perfil actualizado con exito' },
  { pattern: /Email atualizado com sucesso/gi, value: 'Correo actualizado con exito' },
  { pattern: /Email, nome, empresa e telefone sÃ£o obrigatÃ³rios|Email, nome, empresa e telefone são obrigatórios/gi, value: 'El correo, el nombre, la empresa y el telefono son obligatorios' },
  { pattern: /Arquiteto com este email jÃ¡ existe|Arquiteto com este email já existe/gi, value: 'Ya existe un arquitecto con este correo' },
  { pattern: /Nome e CNPJ sao obrigatorios/gi, value: 'El nombre y el RUC/CNPJ son obligatorios' },
  { pattern: /Ja existe uma loja com este CNPJ/gi, value: 'Ya existe una tienda con este RUC/CNPJ' },
  { pattern: /TÃ­tulo, data de inÃ­cio e data de fim sÃ£o obrigatÃ³rios|Título, data de início e data de fim são obrigatórios/gi, value: 'El titulo, la fecha de inicio y la fecha de fin son obligatorios' },
  { pattern: /Multiplicador de pontos deve ser maior que zero/gi, value: 'El multiplicador de puntos debe ser mayor que cero' },
  { pattern: /Data de fim deve ser posterior Ã  data de inÃ­cio|Data de fim deve ser posterior à data de início/gi, value: 'La fecha de fin debe ser posterior a la fecha de inicio' },
  { pattern: /Nome, pontos e estoque sao obrigatorios/gi, value: 'El nombre, los puntos y el stock son obligatorios' },
  { pattern: /Pontos necessarios devem ser maiores que zero/gi, value: 'Los puntos necesarios deben ser mayores que cero' },
  { pattern: /Estoque nao pode ser negativo/gi, value: 'El stock no puede ser negativo' },
  { pattern: /ConteÃºdo e versÃ£o sÃ£o obrigatÃ³rios|Conteúdo e versão são obrigatórios/gi, value: 'El contenido y la version son obligatorios' },
  { pattern: /ID dos termos Ã© obrigatÃ³rio|ID dos termos é obrigatório/gi, value: 'El ID de los terminos es obligatorio' },
  { pattern: /Termos nÃ£o encontrados|Termos não encontrados/gi, value: 'Terminos no encontrados' },
  { pattern: /Termos nÃ£o encontrados ou inativados|Termos não encontrados ou inativados/gi, value: 'Terminos no encontrados o inactivos' },
  { pattern: /Arquiteto criado com sucesso/gi, value: 'Arquitecto creado con exito' },
  { pattern: /Arquiteto atualizado com sucesso/gi, value: 'Arquitecto actualizado con exito' },
  { pattern: /Arquiteto deletado com sucesso/gi, value: 'Arquitecto eliminado con exito' },
  { pattern: /Loja criada com sucesso/gi, value: 'Tienda creada con exito' },
  { pattern: /Loja atualizada com sucesso/gi, value: 'Tienda actualizada con exito' },
  { pattern: /Loja deletada com sucesso/gi, value: 'Tienda eliminada con exito' },
  { pattern: /Status da loja atualizado com sucesso/gi, value: 'Estado de la tienda actualizado con exito' },
  { pattern: /Campanha criada com sucesso/gi, value: 'Campana creada con exito' },
  { pattern: /Campanha atualizada com sucesso/gi, value: 'Campana actualizada con exito' },
  { pattern: /Campanha deletada com sucesso/gi, value: 'Campana eliminada con exito' },
  { pattern: /Premio criado com sucesso/gi, value: 'Premio creado con exito' },
  { pattern: /Premio atualizado com sucesso/gi, value: 'Premio actualizado con exito' },
  { pattern: /Premio deletado com sucesso/gi, value: 'Premio eliminado con exito' },
  { pattern: /Status do premio atualizado com sucesso/gi, value: 'Estado del premio actualizado con exito' },
  { pattern: /Venda atualizada com sucesso/gi, value: 'Venta actualizada con exito' },
  { pattern: /Venda deletada com sucesso/gi, value: 'Venta eliminada con exito' },
  { pattern: /Venda aprovada com sucesso e pontos gerados/gi, value: 'Venta aprobada con exito y puntos generados' },
  { pattern: /Venda registrada com sucesso e enviada para aprovaÃ§Ã£o\.|Venda registrada com sucesso e enviada para aprovação\./gi, value: 'Venta registrada con exito y enviada a aprobacion.' },
  { pattern: /Apenas vendas pendentes podem ser rejeitadas/gi, value: 'Solo las ventas pendientes pueden ser rechazadas' },
  { pattern: /Resgate criado com sucesso/gi, value: 'Canje creado con exito' },
  { pattern: /SolicitaÃ§Ã£o de resgate enviada com sucesso|Solicitação de resgate enviada com sucesso/gi, value: 'Solicitud de canje enviada con exito' },
  { pattern: /Resgate aprovado com sucesso/gi, value: 'Canje aprobado con exito' },
  { pattern: /Entrega registrada com sucesso/gi, value: 'Entrega registrada con exito' },
  { pattern: /Resgate atualizado com sucesso/gi, value: 'Canje actualizado con exito' },
  { pattern: /Resgate deletado com sucesso/gi, value: 'Canje eliminado con exito' },
  { pattern: /Termos criados com sucesso/gi, value: 'Terminos creados con exito' },
  { pattern: /Termos atualizados com sucesso/gi, value: 'Terminos actualizados con exito' },
  { pattern: /Termos aceitos com sucesso/gi, value: 'Terminos aceptados con exito' },
  { pattern: /Notificação não encontrada|Notificacao nao encontrada|NotificaÃ§Ã£o nÃ£o encontrada/gi, value: 'Notificacion no encontrada' },
  { pattern: /título, mensagem e público-alvo são obrigatórios|titulo, mensagem e publico-alvo sao obrigatorios|tÃ­tulo, mensagem e pÃºblico-alvo sÃ£o obrigatÃ³rios/gi, value: 'El titulo, el mensaje y el publico objetivo son obligatorios' },
  { pattern: /Público-alvo inválido|Publico-alvo invalido|PÃºblico-alvo invÃ¡lido/gi, value: 'Publico objetivo invalido' },
  { pattern: /Tipo inválido|Tipo invalido|Tipo invÃ¡lido/gi, value: 'Tipo invalido' },
  { pattern: /Prêmio é obrigatório|Premio e obrigatorio|PrÃªmio Ã© obrigatÃ³rio/gi, value: 'El premio es obligatorio' },
  { pattern: /Nenhum arquivo enviado/gi, value: 'No se envio ningun archivo' },
  { pattern: /Arquivo invalido/gi, value: 'Archivo invalido' },
  { pattern: /Arquivo nao encontrado/gi, value: 'Archivo no encontrado' },
  { pattern: /Formato de arquivo nao suportado/gi, value: 'Formato de archivo no soportado' },
  { pattern: /Upload falhou/gi, value: 'La carga fallo' },
  { pattern: /Falha ao carregar arquivo/gi, value: 'No se pudo cargar el archivo' },
  { pattern: /Apenas arquivos de imagem são permitidos \(JPEG, PNG, WebP\)|Apenas arquivos de imagem sao permitidos \(JPEG, PNG, WebP\)/gi, value: 'Solo se permiten archivos de imagen (JPEG, PNG, WebP)' },
  { pattern: /Venda rejeitada/gi, value: 'Venta rechazada' },
  { pattern: /Failed to apply bucket policy/gi, value: 'No se pudo aplicar la politica del bucket' },
  { pattern: /Bucket policy applied successfully! Bucket is now public\./gi, value: 'La politica del bucket se aplico correctamente. El bucket ahora es publico.' },
  { pattern: /Lojista sem loja associada/gi, value: 'Comerciante sin tienda asociada' },
  { pattern: /architect_id e amount_usd sÃ£o obrigatÃ³rios|architect_id e amount_usd são obrigatórios/gi, value: 'architect_id y amount_usd son obligatorios' },
  { pattern: /Arquiteto deve completar o perfil antes de acumular pontos\. PeÃ§a ao arquiteto que finalize o cadastro\.|Arquiteto deve completar o perfil antes de acumular pontos\. Peça ao arquiteto que finalize o cadastro\./gi, value: 'El arquitecto debe completar su perfil antes de acumular puntos. Pidele que finalice su registro.' },
  { pattern: /Arquiteto deve completar o perfil antes de acumular pontos/gi, value: 'El arquitecto debe completar su perfil antes de acumular puntos' },
  { pattern: /Pontos insuficientes\. VocÃª tem ([0-9.,]+) pontos disponÃ­veis e precisa de ([0-9.,]+)|Pontos insuficientes\. Você tem ([0-9.,]+) pontos disponíveis e precisa de ([0-9.,]+)/gi, value: (_m, a, b, c, d) => `Puntos insuficientes. Tienes ${a || c} puntos disponibles y necesitas ${b || d}` },
  { pattern: /Resgate nÃ£o pode ser aprovado â€” status atual: ([a-z_]+)/gi, value: (_m, status) => `El canje no puede aprobarse. Estado actual: ${status}` },
  { pattern: /Resgate nÃ£o pode ser marcado como entregue â€” status atual: ([a-z_]+)/gi, value: (_m, status) => `El canje no puede marcarse como entregado. Estado actual: ${status}` },
  { pattern: /Arquiteto nÃ£o tem pontos suficientes para este resgate|Arquiteto não tem pontos suficientes para este resgate/gi, value: 'El arquitecto no tiene puntos suficientes para este canje' },
  { pattern: /Campo active deve ser boolean/gi, value: 'El campo active debe ser booleano' },
  { pattern: /Failed to list pending users/gi, value: 'No se pudo listar a los usuarios pendientes' },
  { pattern: /Failed to get user details/gi, value: 'No se pudieron obtener los detalles del usuario' },
  { pattern: /User not found/gi, value: 'Usuario no encontrado' },
  { pattern: /User is not in pending status/gi, value: 'El usuario no esta en estado pendiente' },
  { pattern: /User approved successfully/gi, value: 'Usuario aprobado con exito' },
  { pattern: /Failed to approve user/gi, value: 'No se pudo aprobar al usuario' },
  { pattern: /User rejected successfully/gi, value: 'Usuario rechazado con exito' },
  { pattern: /Failed to reject user/gi, value: 'No se pudo rechazar al usuario' },
  { pattern: /Failed to list users/gi, value: 'No se pudo listar a los usuarios' },
  { pattern: /Failed to fetch dashboard stats/gi, value: 'No se pudieron cargar las estadisticas del panel' },
  { pattern: /Authentication service not configured/gi, value: 'El servicio de autenticacion no esta configurado' },
  { pattern: /Firebase credentials missing\. Contact administrator\./gi, value: 'Faltan las credenciales de Firebase. Contacte al administrador.' },
  { pattern: /No authorization header provided/gi, value: 'No se envio la cabecera de autorizacion' },
  { pattern: /No token provided/gi, value: 'No se envio el token' },
  { pattern: /Token expired/gi, value: 'El token ha expirado' },
  { pattern: /Invalid or expired token/gi, value: 'Token invalido o expirado' },
  { pattern: /User not authenticated/gi, value: 'Usuario no autenticado' },
  { pattern: /User has no assigned role/gi, value: 'El usuario no tiene un rol asignado' },
  { pattern: /Insufficient permissions/gi, value: 'Permisos insuficientes' },
  { pattern: /Failed to verify user role/gi, value: 'No se pudo verificar el rol del usuario' },
  { pattern: /Internal Server Error/gi, value: 'Error interno del servidor' },
  { pattern: /Not Found/gi, value: 'No encontrado' },
];

const SPANISH_ACCENT_FIXES: Array<[RegExp, string]> = [
  [/\baprobacion\b/gi, 'aprobación'],
  [/\bautenticacion\b/gi, 'autenticación'],
  [/\bcampana\b/gi, 'campaña'],
  [/\bcampanas\b/gi, 'campañas'],
  [/\bcontrasena\b/gi, 'contraseña'],
  [/\bcredenciales invalidas\b/gi, 'credenciales inválidas'],
  [/\bcredito\b/gi, 'crédito'],
  [/\besta\b/gi, 'está'],
  [/\bestan\b/gi, 'están'],
  [/\bexito\b/gi, 'éxito'],
  [/\binicio de sesion\b/gi, 'inicio de sesión'],
  [/\binvalido\b/gi, 'inválido'],
  [/\bmaximo\b/gi, 'máximo'],
  [/\bpolitica\b/gi, 'política'],
  [/\bpublico\b/gi, 'público'],
  [/\bsesion\b/gi, 'sesión'],
  [/\bTerminos\b/g, 'Términos'],
  [/\bTitulo\b/g, 'Título'],
  [/\bUsuario no esta en estado pendiente\b/g, 'Usuario no está en estado pendiente'],
];

const translateText = (text: string): string => {
  let output = text;

  for (const replacer of REPLACERS) {
    output = output.replace(replacer.pattern, replacer.value as never);
  }

  output = output.replace(/\(campanha ativa: /gi, '(campana activa: ');

  for (const [pattern, value] of SPANISH_ACCENT_FIXES) {
    output = output.replace(pattern, value);
  }

  return output;
};

const translateEnvelope = (body: unknown): unknown => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return body;
  }

  const output = { ...(body as Record<string, unknown>) };

  if (typeof output.error === 'string') {
    output.error = translateText(output.error);
  }

  if (typeof output.message === 'string') {
    output.message = translateText(output.message);
  }

  return output;
};

export const translateApiResponseMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => originalJson(translateEnvelope(body))) as typeof res.json;
  next();
};
