import { IsString, IsUUID, MinLength, IsNotEmpty } from 'class-validator';

export class NotificarDto {
  @IsUUID('4', {
    message: 'O ID da mensagem precisa ser um UUID válido na versão 4.',
  })
  @IsString({ message: 'O ID da mensagem precisa ser do tipo string.' })
  @IsNotEmpty({ message: 'O ID da mensagem não pode ser vazio.' })
  mensagemId: string;

  @IsString({ message: 'O conteúdo da mensagem precisa ser uma string.' })
  @IsNotEmpty({ message: 'O conteúdo da mensagem não pode ser vazio.' })
  @MinLength(1, {
    message: 'O conteúdo da mensagem precisa ter no mínimo 1 caractere.',
  })
  conteudoMensagem: string;
}
