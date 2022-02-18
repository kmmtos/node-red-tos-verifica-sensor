"use strict";
module.exports = function (RED) {
  function verificaSensorTOS(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    var flow = this.context().flow;
    var sensor_global;
    var _msg;
    var modo_operacao;
    var intervalo_verificacao;
    var quantidade_amostra;
    var tentativas;
    var aux = 1;
    var contador_ativado = 0;
    var contador_desativado = 0;
    var _done = false;
    var st;

    function Ativado() {
      // primeira saida é done atendeu a regra
      // segunda saida é tempo execedido tentou a regra sem sucesso nas n tentativas informadas
      node.status({
        fill: "green",
        shape: "dot",
        text: `Verificando ativado ${aux} de ${tentativas} `,
      });
      //verifica se sensor esta ativado e incrementa contador
      if (global.get(sensor_global) == true) {
        contador_ativado++;
      } else {
        contador_ativado = 0;
      }

      //se contador >= quantidade_amostra retorna done
      if (contador_ativado >= quantidade_amostra) {
        _done = true;
        node.send([_msg, null, null]);
      }

      // se executou quantidade de vezes definida no contador
      if (aux >= tentativas) {
        node.send([null, _msg, null]);
        _done = true;
      }
      //se !done chama recursivo
      if (!_done) {
        aux++;
        st = setTimeout(Ativado, intervalo_verificacao);
      } else if (_done == true || aux >= tentativas) {
        clearTimeout(st);
      }
    }

    function Desativado() {
      // primeira saida é done atendeu a regra
      // segunda saida é tempo execedido tentou a regra sem sucesso nas n tentativas informadas
      node.status({
        fill: "green",
        shape: "dot",
        text: `Verificando desativado ${aux} de ${tentativas} `,
      });
      //verifica se sensor esta desativado e incrementa contador
      if (global.get(sensor_global) == false) {
        contador_desativado++;
      } else {
        contador_desativado = 0;
      }

      //se contador >= quantidade_amostra retorna done
      if (contador_desativado >= quantidade_amostra) {
        _done = true;
        _msg.payload = true;
        node.send([_msg, null, null]);
      }

      // se executou quantidade de vezes definida no contador
      if (aux >= tentativas) {
        _msg.payload = true;
        node.send([null, _msg, null]);
        _done = true;
      }
      //se !done chama recursivo
      if (!_done) {
        aux++;
        st = setTimeout(Desativado, intervalo_verificacao);
      } else if (_done == true || aux >= tentativas) {
        clearTimeout(st);
      }
    }

    node.on("input", function (msg, send, done) {
      if (msg.modo_operacao) {
        try {
          //seta variaveis
          sensor_global = msg.sensor;
          modo_operacao = msg.modo_operacao;
          intervalo_verificacao = msg.intervalo_verificacao;
          quantidade_amostra = msg.quantidade_amostra;
          tentativas = msg.tentativas;
          _msg = msg;
          aux = 1;
          contador_ativado = 0;
          contador_desativado = 0;
          _done = false;
          clearTimeout(st);
          if (modo_operacao == "ATIVADO") {
            Ativado();
          } else if (modo_operacao == "DESATIVADO") {
            Desativado();
          } else {
            msg.payload = "modo_operacao nao tratado";
            node.status({
              fill: "red",
              shape: "dot",
              text: msg.payload,
            });
            node.send([null, null, msg]);
            
          }
        } catch (error) {
          msg.payload = error;
          node.status({
            fill: "red",
            shape: "dot",
            text: msg.payload,
          });
          //terceira saida error
          node.send([null, null, msg]);
          done(error);
        }
      } else {
        msg.payload = "msg.modo_operacao nao informado";
        node.status({
          fill: "red",
          shape: "dot",
          text: msg.payload,
        });
        node.send([null, null, msg]);
      }
    });
    this.on("close", function (removed, done) {
      clearTimeout(st);
      node.status({});

      done();
    });
  }
  RED.nodes.registerType("verifica sensor TOS", verificaSensorTOS);
};
